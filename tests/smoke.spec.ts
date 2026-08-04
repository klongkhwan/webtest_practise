import { expect, test } from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const loginUrl =
  process.env.SMOKE_LOGIN_URL ??
  new URL(process.env.LOGIN_PATH ?? '/login', baseUrl).toString();

const email = process.env.SMOKE_EMAIL ?? 'adminpreaw@gmail.com';
const password = process.env.SMOKE_PASSWORD ?? 'test1150';

test('smoke: login successfully and navigate to dashboard', async ({ page }) => {
  // 1. เปิดหน้า Login
  const response = await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  expect(response, `No response received from ${loginUrl}`).not.toBeNull();
  expect(response?.ok(), `Login page returned ${response?.status()}`).toBeTruthy();

  // 2. กรอกข้อมูล Email และ Password
  await page.getByRole('textbox', { name: 'Email *' }).fill(email);
  await page.getByLabel('Password *').fill(password);

  // 3. กดปุ่ม Sign in
  await page.getByRole('button', { name: 'Sign in' }).click();

  // 4. รอและตรวจสอบว่าเปลี่ยนหน้าไปยัง Dashboard (เพิ่ม Timeout เป็น 20s สำหรับสภาพแวดล้อม CI)
  await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 20000 });

  // 5. เช็คความถูกต้องขององค์ประกอบในหน้า Dashboard
  await expect(page.getByRole('heading', { name: 'ADMIN PREAW.' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('link', { name: 'EXPLORE COURSES' })).toBeVisible();
});