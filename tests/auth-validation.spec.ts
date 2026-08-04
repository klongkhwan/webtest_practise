import { test, expect } from '@playwright/test';

// We run tests against the running local Next.js dev or prod server.
// The base URL can be configured in playwright.config.ts or passed via CLI.
// Since Playwright runs in Node.js, we can write standard HTTP validation tests.
test.describe('Auth API Validation', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.describe('POST /api/auth/login', () => {
    test('should reject missing email or password with HTTP 400', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/login`, {
        data: { email: 'test@example.com' } // missing password
      });
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Missing required fields');

      const response2 = await request.post(`${baseUrl}/api/auth/login`, {
        data: { password: 'password123' } // missing email
      });
      expect(response2.status()).toBe(400);
      const json2 = await response2.json();
      expect(json2.error).toContain('Missing required fields');
    });

    test('should reject non-string email with HTTP 400', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/login`, {
        data: { email: 12345, password: 'password123' }
      });
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Validation error');
    });

    test('should reject blank email with HTTP 400', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/login`, {
        data: { email: '   ', password: 'password123' }
      });
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Validation error');
    });

    test('should reject malformed email with HTTP 400', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/login`, {
        data: { email: 'invalid-email', password: 'password123' }
      });
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Validation error');
    });

    test('should trim email and return HTTP 401 on failed credential check', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/login`, {
        data: { email: '  wrong-user@example.com  ', password: 'wrong-password' }
      });
      expect(response.status()).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Invalid credentials');
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('should reject invalid Bearer token with HTTP 401 and not fall back to cookie session even if it exists', async ({ request }) => {
      // Create a request with an invalid Bearer token but also supply a mock cookie that could be seen as valid.
      // Even if no cookies are set, the Bearer token presence triggers the strict Bearer check, returning 401.
      const response = await request.get(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token-abc-123',
          'Cookie': 'sb-pnrkwltodicfgrpunrji-auth-token=some-mock-session-cookie'
        }
      });
      expect(response.status()).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    test('should reject request when Authorization header is supplied but is not a Bearer token', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': 'Basic dGVzdDp0ZXN0'
        }
      });
      expect(response.status()).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });
});
