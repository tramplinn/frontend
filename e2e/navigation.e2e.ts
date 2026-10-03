import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/* Обходит приложение кликами по ссылкам в одной вкладке, как пользователь.
   Ловит страницы, которые падают при монтировании или не дают с себя уйти
   (URL меняется, а на экране остаётся старая страница), и любые ошибки Vue.

   E2E_REFRESH_TOKEN — сырой refresh-токен (backend/scripts/issue_refresh_token.py);
   с ним проходятся и закрытые страницы, без него — только публичные.
   Токен одноразовый и ротируется при входе, поэтому весь обход — один тест
   в одной вкладке, а на каждый прогон нужен свежий токен. */

interface Step {
  /** Точный путь ссылки или префикс: тогда берётся первая подходящая ссылка на странице. */
  path: string
  prefix?: boolean
  auth?: boolean
}

const STEPS: Step[] = [
  { path: '/courses' },
  { path: '/courses/', prefix: true },
  { path: '/sections' },
  { path: '/learning' },
  { path: '/algorithms' },
  { path: '/algorithms/', prefix: true },
  { path: '/people' },
  { path: '/people/', prefix: true },
  { path: '/projects' },
  { path: '/projects/', prefix: true },
  { path: '/me', auth: true },
  { path: '/manage/content', auth: true },
  { path: '/manage/news', auth: true },
  { path: '/manage/algorithms', auth: true },
  { path: '/admin/users', auth: true },
  { path: '/' },
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
  return page.locator('main').innerText()
}

async function linkFor(page: Page, step: Step): Promise<string | null> {
  const selector = step.prefix ? `a[href^="${step.path}"]` : `a[href="${step.path}"]`
  const hrefs = await page
    .locator(selector)
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
  // Для префикса нужна именно вложенная страница, а не сам раздел или /projects/new.
  return (
    hrefs.find((href) => !step.prefix || (href !== step.path && !href.endsWith('/new'))) ?? null
  )
}

test('по приложению можно ходить кликами без ошибок', async ({ page, context, baseURL }) => {
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
  await expect(page.locator('main')).not.toBeEmpty()
  if (refreshToken) {
    await expect(page.locator('a[href="/me"]').first(), 'refresh-токен не сработал').toBeVisible()
  }

  for (const step of STEPS) {
    if (step.auth && !refreshToken) continue
    const href = await linkFor(page, step)
    if (href === null) {
      test.info().annotations.push({ type: 'skip', description: `нет ссылки ${step.path}` })
      continue
    }

    await test.step(`${page.url()} → ${href}`, async () => {
      const before = await mainText(page)
      await page.locator(`a[href="${href}"]`).first().click()

      await expect(page).toHaveURL(new URL(href, page.url()).href)
      // Главная проверка: содержимое действительно сменилось, а не только адрес.
      await expect.poll(() => mainText(page), { message: 'страница не сменилась' }).not.toBe(before)
      await page.waitForLoadState('networkidle')
      expect(errors, `ошибки на ${href}`).toEqual([])
    })
  }
})
