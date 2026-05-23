/**
 * Phase 10 smoke — production readiness guards.
 *
 * Runs against the Docker app stack. Docs checks are skipped unless
 * EXPECT_PRODUCTION_DOCS_BLOCKED=1 because development keeps OpenAPI available
 * for schema generation.
 */
import { expect, request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function apiContext() {
	return playwrightRequest.newContext({ baseURL: BACKEND_URL });
}

test.describe('Phase 10 — production readiness smoke', () => {
	test('public registration is blocked', async () => {
		const ctx = await apiContext();
		const res = await ctx.post('/api/v1/public/auth/register', {
			data: {
				email: `phase10-${Date.now()}@example.com`,
				password: 'E2ePass123!',
				full_name: 'Phase 10 Doctor',
				consent_152fz: true,
			},
		});

		expect(res.status()).toBe(403);
		await expect(res.json()).resolves.toEqual({ detail: 'Public registration is disabled' });
		await ctx.dispose();
	});

	test('login page does not expose demo helper in production builds', async ({ page }) => {
		if (process.env.EXPECT_PRODUCTION_UI === '1') {
			await page.goto('/login');
			await expect(page.getByText(/demo@docassist\.dev|demo\.p1|Demo1234|Patient1/i)).toHaveCount(0);
			await expect(page.getByRole('button', { name: /Заполнить|Fill/i })).toHaveCount(0);
			return;
		}

		test.skip(true, 'development build intentionally shows demo credential helper');
	});

	test('health endpoint responds', async () => {
		const ctx = await apiContext();
		const res = await ctx.get('/api/v1/health');

		expect(res.ok()).toBe(true);
		await ctx.dispose();
	});

	test('docs and OpenAPI are blocked in production mode', async () => {
		if (process.env.EXPECT_PRODUCTION_DOCS_BLOCKED !== '1') {
			test.skip(true, 'development keeps docs/openapi enabled for type generation');
		}

		const ctx = await apiContext();
		for (const path of ['/docs', '/redoc', '/openapi.json']) {
			const res = await ctx.get(path);
			expect(res.status()).toBe(404);
		}
		await ctx.dispose();
	});
});
