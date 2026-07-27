import { expect, test, type Page } from '@playwright/test'

const API_URL = 'http://127.0.0.1:8001/api/v1'
const TEST_PASSWORD = 'correct-horse-battery-staple'

async function registerVisualUser(page: Page, email: string): Promise<string> {
  await page.goto('/register')
  await page.getByLabel('Username').fill('Visual Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  const token = await page.evaluate<string | null>(
    "window.localStorage.getItem('cyberlab_token')",
  )
  if (!token) throw new Error('Registration did not produce an access token')
  return token
}

async function configureStaticTheme(
  page: Page,
  token: string,
  theme: 'light' | 'dark',
): Promise<void> {
  const response = await page.request.patch(`${API_URL}/settings/me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      theme,
      reduced_motion: true,
      show_crisis_cube: false,
    },
  })
  expect(response.ok()).toBe(true)
}

test('login card visual baseline', async ({ page }) => {
  await page.goto('/login')

  await expect(page.locator('form.auth-card')).toHaveScreenshot('login-card.png')
})

for (const theme of ['light', 'dark'] as const) {
  test(`subjects workspace ${theme} theme visual baseline`, async ({ page }) => {
    const token = await registerVisualUser(page, `visual-${theme}@example.com`)
    await configureStaticTheme(page, token, theme)
    await page.goto('/subjects')
    await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible()

    await expect(page.getByRole('main')).toHaveScreenshot(`subjects-${theme}.png`)
  })
}
