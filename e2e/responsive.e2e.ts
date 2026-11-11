import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  login: 'student',
  name: 'Студент',
  email: null,
  avatarUrl: null,
  studentNumber: null,
  role: 'student',
  isActive: true,
  headline: null,
  bio: null,
  specialty: null,
  grade: null,
  experienceYears: null,
  company: null,
  university: null,
  interests: [],
  resumeAssetId: null,
  resumeUrl: null,
  identities: [],
}

const news = Array.from({ length: 3 }, (_, index) => ({
  id: `00000000-0000-4000-8000-00000000001${String(index)}`,
  slug: `news-${String(index)}`,
  title: 'Вебинар: как проходить техническое интервью',
  summary: `Разбираем типичные ошибки. https://example.org/${'long-path'.repeat(20)}`,
  bodyMd: 'Текст новости',
  status: 'published',
  publishedAt: '2026-11-01T10:00:00Z',
  photos: [
    {
      id: '00000000-0000-4000-8000-000000000020',
      filename: 'cover.png',
      mime: 'image/png',
      size: 100,
      url: 'https://example.org/cover.png',
    },
  ],
}))

// Эти проверки верстки не требуют запущенного бэкенда.
async function mockApi(page: Page, signedIn: boolean, sessionReady = Promise.resolve()) {
  await page.route('https://example.org/cover.png', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  )
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    if (path === '/auth/refresh') {
      await sessionReady
      await route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? { accessToken: 'test', expiresAt: '2099-01-01T00:00:00Z' }
          : { code: 'unauthorized', message: 'No session' },
      })
      return
    }
    const responses: Record<string, unknown> = {
      '/auth/me': user,
      '/auth/providers': { providers: [] },
      '/news': { items: news, total: news.length, limit: 10, offset: 0 },
      '/news/news-0': news[0],
      '/me/invites': [],
      '/recommendations': { courses: [], algorithms: [] },
    }
    expect(path in responses, `неожиданный API-запрос: ${path}`).toBe(true)
    await route.fulfill({ json: responses[path] })
  })
}

for (const width of [320, 390, 430, 768, 1280]) {
  for (const signedIn of [false, true]) {
    test(`новости помещаются в экран ${String(width)}px, вход: ${String(signedIn)}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 })
      await mockApi(page, signedIn)
      await page.goto('/')
      const cards = page.locator('.feed article')
      await expect(cards).toHaveCount(news.length)
      await expect(cards.first().locator('img')).toBeVisible()
      const first = await cards.nth(0).boundingBox()
      const second = await cards.nth(1).boundingBox()
      if (!first || !second) throw new Error('карточки новостей не видны')
      expect(second.y).toBeGreaterThanOrEqual(first.y + first.height)
      expect(second.x).toBe(first.x)
      expect(first.x + first.width).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      await cards.first().getByRole('link').click()
      await expect(page).toHaveURL(/\/news\/news-0$/)
      await expect(page.locator('main h1')).toHaveText(news[0]?.title ?? '')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    })
  }
}

for (const signedIn of [false, true]) {
  test(`вход скрыт до проверки сессии, вход: ${String(signedIn)}`, async ({ page }) => {
    let release!: () => void
    const sessionReady = new Promise<void>((resolve) => (release = resolve))
    await mockApi(page, signedIn, sessionReady)
    const refresh = page.waitForRequest('**/api/v1/auth/refresh')
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await refresh
    await expect(page.locator('.header')).toBeVisible()
    const signIn = page.locator('.header').getByRole('button', { name: 'войти', exact: true })
    await expect(signIn).toHaveCount(0)
    release()
    await expect(page.locator('.feed article')).toHaveCount(news.length)
    if (signedIn) {
      await expect(page.locator('.sidebar .me')).toBeAttached()
      await expect(signIn).toHaveCount(0)
    } else {
      await expect(signIn).toBeVisible()
    }
  })
}

for (const width of [320, 1280]) {
  test(`управление новостями и задачами использует общий список, ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await mockApi(page, true)
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ json: { ...user, role: 'admin' } }),
    )
    await page.route('**/api/v1/authoring/news*', (route) =>
      route.fulfill({ json: { items: news, total: news.length, limit: 50, offset: 0 } }),
    )
    const problem = {
      id: '00000000-0000-4000-8000-000000000030',
      title: 'Правильная скобочная последовательность и другие задачи для собеседования',
      provider: 'internal',
      externalKey: null,
      externalUrl: null,
      statementMd: '',
      statementHtml: '',
      difficulty: 'easy',
      tags: [],
      timeLimitMs: 1000,
      memoryLimitKb: 262144,
      status: 'published',
      testCases: [],
      templates: [],
    }
    let removed = false
    await page.route('**/api/v1/authoring/algorithms/problems**', async (route) => {
      if (route.request().method() === 'DELETE') {
        removed = true
        await route.fulfill({ status: 204 })
      } else {
        await route.fulfill({
          json: { items: [problem], total: 1, limit: 50, offset: 0 },
        })
      }
    })
    for (const path of ['/manage/news', '/manage/algorithms']) {
      await page.goto(path)
      await expect(page.locator('main .item-link').first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await expect(page.locator('main .row-menu').first()).toBeVisible()
    }
    await page.locator('main .row-menu button').first().click()
    await page.getByRole('menuitem', { name: 'удалить', exact: true }).click()
    expect(removed).toBe(false)
    await page.getByRole('menuitem', { name: 'точно удалить?', exact: true }).click()
    await expect(page.locator('main .item-link')).toHaveCount(0)
    expect(removed).toBe(true)
  })
}
