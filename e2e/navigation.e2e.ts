import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/* Обходит приложение кликами по ссылкам в одной вкладке, как пользователь.
   Ловит страницы, которые падают при монтировании или не дают с себя уйти
   (URL меняется, а на экране остаётся старая страница), и любые ошибки Vue.

   E2E_REFRESH_TOKEN — сырой refresh-токен (backend/scripts/issue_refresh_token.py);
   с ним проходятся и закрытые страницы, без него — только публичные.
   Токен одноразовый и ротируется при входе, поэтому весь обход — один тест
   в одной вкладке, а на каждый прогон нужен свежий токен. */

type Step =
  | {
      /** Точный путь ссылки или шаблон: тогда берётся первая подходящая ссылка на странице. */
      link: string | RegExp
      auth?: boolean
    }
  | {
      /** Клик по кнопке. Без to — без перехода, открывает ссылки (раскрыть курс в
          дереве контента); с to — кнопка ведёт на страницу через router.push. */
      click: string
      to?: string
      auth?: boolean
    }

/** Вложенная страница раздела, но не форма создания (…/new). */
const child = (section: string): RegExp => new RegExp(`^/${section}/(?!new$)[^/?#]+$`)

const STEPS: Step[] = [
  { link: '/courses' },
  { link: child('courses') },
  { link: /^\/courses\/[^/]+\/[^/]+\/lessons\// },
  { link: '/courses' },
  { link: child('courses') },
  { link: /^\/courses\/[^/]+\/[^/]+\/quizzes\//, auth: true },
  { link: '/courses', auth: true },
  // Практика есть не в каждом курсе; в сидах — в курсе алгоритмов.
  { click: 'main button:has-text("подготовка к собеседованию")', auth: true },
  { link: '/courses/algorithms-interview', auth: true },
  { link: /^\/courses\/[^/]+\/[^/]+\/practice\//, auth: true },
  { link: '/sections' },
  { link: '/learning' },
  { link: '/algorithms' },
  { link: child('algorithms') },
  { link: '/people' },
  { link: child('people') },
  { link: '/projects' },
  { click: 'main button:has-text("создать проект")', to: '/projects/new', auth: true },
  { link: '/projects' },
  { link: child('projects') },
  { link: /^\/projects\/[^/]+\/settings/, auth: true },
  { link: '/me', auth: true },
  { link: '/manage/content', auth: true },
  { click: 'button.course', auth: true },
  { link: /^\/manage\/lessons\//, auth: true },
  { link: '/manage/content', auth: true },
  { click: 'button.course', auth: true },
  { link: /^\/manage\/quizzes\//, auth: true },
  { link: '/manage/content', auth: true },
  { click: 'button.course:has-text("Алгоритм")', auth: true },
  { link: /^\/manage\/practice-sets\//, auth: true },
  { link: '/manage/news', auth: true },
  { link: child('manage/news'), auth: true },
  { link: '/manage/algorithms', auth: true },
  { link: child('manage/algorithms'), auth: true },
  { link: '/admin/users', auth: true },
  { link: '/' },
  { link: child('news') },
  { link: '/' },
]

const refreshToken = process.env.E2E_REFRESH_TOKEN

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    const text = message.text()
    // Сетевые ответы 4xx/5xx браузер тоже пишет в console.error — это не баг вёрстки.
    if (text.startsWith('Failed to load resource')) return
    if (message.type() === 'error' || text.includes('[Vue warn]')) {
      errors.push(`console.${message.type()}: ${text}`)
    }
  })
  return errors
}

function mainText(page: Page): Promise<string> {
  return page.locator('#main-content').innerText()
}

/** Ссылки часто дорисовываются после загрузки (панель модуля, каталог после
    debounce), поэтому ждём подходящую до LINK_WAIT_MS, а не берём первый снимок. */
const LINK_WAIT_MS = 5000

async function linkFor(page: Page, link: string | RegExp): Promise<string | null> {
  const deadline = Date.now() + LINK_WAIT_MS
  for (;;) {
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => links.map((node) => node.getAttribute('href') ?? ''))
    const found = hrefs.find((href) => (typeof link === 'string' ? href === link : link.test(href)))
    if (found !== undefined || Date.now() > deadline) return found ?? null
    await page.waitForTimeout(250)
  }
}

test('по приложению можно ходить кликами без ошибок', async ({ page, context, baseURL }) => {
  // Десятки переходов с ожиданием networkidle не укладываются в дефолтные 30 с.
  test.setTimeout(300_000)
  if (refreshToken) {
    await context.addCookies([
      {
        name: 'tramplin_refresh',
        value: refreshToken,
        url: new URL('/api/v1/auth', baseURL).href,
        httpOnly: true,
      },
    ])
  }
  const errors = watchErrors(page)

  await page.goto('/')
  await expect(page.locator('#main-content')).not.toBeEmpty()
  if (refreshToken) {
    await expect(page.locator('a[href="/me"]').first(), 'refresh-токен не сработал').toBeVisible()
  }

  for (const step of STEPS) {
    if (step.auth && !refreshToken) continue
    let href: string | null
    let trigger: Locator
    if ('click' in step) {
      trigger = page.locator(step.click).first()
      if (step.to === undefined) {
        await trigger.click()
        continue
      }
      href = (await trigger.count()) > 0 ? step.to : null
    } else {
      href = await linkFor(page, step.link)
      trigger = page.locator(`a[href="${href ?? ''}"]`).first()
    }
    if (href === null || new URL(href, page.url()).pathname === new URL(page.url()).pathname) {
      const target = 'click' in step ? step.click : String(step.link)
      test.info().annotations.push({ type: 'skip', description: `нет перехода ${target}` })
      continue
    }

    await test.step(`${page.url()} → ${href}`, async () => {
      const before = await mainText(page)
      await trigger.click()

      await expect(page).toHaveURL(new URL(href, page.url()).href)
      // Главная проверка: содержимое действительно сменилось, а не только адрес.
      await expect.poll(() => mainText(page), { message: 'страница не сменилась' }).not.toBe(before)
      await page.waitForLoadState('networkidle')
      expect(errors, `ошибки на ${href}`).toEqual([])
    })
  }
})
