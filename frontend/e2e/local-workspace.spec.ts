import { expect, test, type Page } from '@playwright/test'

const TEST_PASSWORD = 'correct-horse-battery-staple'

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}

async function registerLocalUser(page: Page, email: string): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Username').fill('E2E User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText(email, { exact: true })).toBeVisible()
}

test('protects private routes and shows API authentication errors', async ({ page }) => {
  await page.goto('/tasks')

  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill('missing@example.test')
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('creates a local subject and task and exposes them across workspace views', async ({ page }) => {
  const email = uniqueEmail('workspace')
  const subjectName = `E2E Subject ${Date.now()}`
  const taskTitle = `E2E Task ${Date.now()}`

  await registerLocalUser(page, email)

  await page.goto('/subjects')
  await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible()
  const createItemForm = page.locator('form').filter({
    has: page.getByRole('heading', { name: 'Create item' }),
  })
  await createItemForm.getByLabel('Name').fill(subjectName)
  await createItemForm.getByRole('button', { name: 'Create subject' }).click()
  await expect(page.getByRole('heading', { name: subjectName })).toBeVisible()

  await createItemForm.getByRole('button', { name: 'Task', exact: true }).click()
  await createItemForm.getByLabel('Title').fill(taskTitle)
  await createItemForm.getByLabel('Subject').selectOption({ label: subjectName })
  await createItemForm.getByRole('button', { name: 'Create task' }).click()

  await page.goto('/tasks')
  await expect(page.getByRole('button', { name: taskTitle, exact: true })).toBeVisible()

  await page.goto('/calendar')
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

  await page.goto('/settings')
  await expect(page.getByRole('main').getByText(email, { exact: true })).toBeVisible()
})
