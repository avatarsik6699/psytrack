/**
 * Phase 08 smoke — Patient Portal Polish
 *
 * Requires the full stack:
 *   Backend  → BACKEND_URL  (default http://localhost:8000)
 *   Frontend → PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *
 * Strategy: register a doctor, create a patient, then authenticate as the
 * patient via temp credentials and walk every new patient route.
 */
import { expect, request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';
const LS_AUTH_KEY = 'docassist.auth.token';
const LS_VERSION = 2;

type TokenPair = { access_token: string; refresh_token: string; token_type: string };

async function registerDoctor(email: string, password: string) {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post('/api/v1/public/auth/register', {
		data: { email, password, full_name: 'E2E Doctor P08', consent_152fz: true },
	});
	if (!res.ok()) throw new Error(`Register failed ${res.status()}: ${await res.text()}`);
	const tokens = (await res.json()) as TokenPair;
	await ctx.dispose();
	return tokens;
}

async function apiPost<T>(path: string, body: unknown, token: string): Promise<T> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post(path, {
		data: body,
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok()) {
		const text = await res.text();
		await ctx.dispose();
		throw new Error(`POST ${path} failed ${res.status()}: ${text}`);
	}
	const data = (await res.json()) as T;
	await ctx.dispose();
	return data;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.get(path, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok()) {
		const text = await res.text();
		await ctx.dispose();
		throw new Error(`GET ${path} failed ${res.status()}: ${text}`);
	}
	const data = (await res.json()) as T;
	await ctx.dispose();
	return data;
}

async function patientLogin(tempLogin: string, password: string): Promise<TokenPair> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post('/api/v1/public/auth/patient-login', {
		data: { temp_login: tempLogin, password },
	});
	if (!res.ok()) throw new Error(`Patient login failed ${res.status()}: ${await res.text()}`);
	const tokens = (await res.json()) as TokenPair;
	await ctx.dispose();
	return tokens;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Phase 08 — Patient Portal', () => {
	let doctorTokens: TokenPair;
	let patientTokens: TokenPair;

	test.beforeAll(async () => {
		const email = `e2e-p08-${Date.now()}@example.com`;
		const password = 'E2ePass123!';
		doctorTokens = await registerDoctor(email, password);

		// Create a patient
		const created = await apiPost<{ temp_login: string; temp_password: string }>(
			'/api/v1/doctor/patients',
			{ full_name: 'E2E P08 Patient' },
			doctorTokens.access_token
		);

		patientTokens = await patientLogin(created.temp_login, created.temp_password);
	});

	test.beforeEach(async ({ page }) => {
		await page.addInitScript(
			({ key, version, data }) => {
				window.localStorage.setItem(key, JSON.stringify({ version, data }));
			},
			{ key: LS_AUTH_KEY, version: LS_VERSION, data: patientTokens }
		);
	});

	// -------------------------------------------------------------------------
	// Backend endpoint smoke
	// -------------------------------------------------------------------------

	test('GET /patient/tasks returns array', async () => {
		const data = await apiGet<unknown[]>('/api/v1/patient/tasks', patientTokens.access_token);
		expect(Array.isArray(data)).toBe(true);
	});

	test('GET /patient/me returns patient profile', async () => {
		const data = await apiGet<Record<string, unknown>>('/api/v1/patient/me', patientTokens.access_token);
		expect(data).toHaveProperty('full_name');
		expect(data).toHaveProperty('doctor_full_name');
		expect(data).toHaveProperty('onboarding_complete');
	});

	test('PATCH /auth/me/email updates email', async () => {
		const email = `patient-${Date.now()}@example.com`;
		const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
		const res = await ctx.patch('/api/v1/public/auth/me/email', {
			data: { email },
			headers: { Authorization: `Bearer ${patientTokens.access_token}` },
		});
		expect(res.ok()).toBe(true);
		const body = (await res.json()) as Record<string, unknown>;
		expect(body.ok).toBe(true);
		await ctx.dispose();
	});

	// -------------------------------------------------------------------------
	// Frontend route smoke
	// -------------------------------------------------------------------------

	test('home dashboard renders stat cards or empty state', async ({ page }) => {
		await page.goto('/dashboard');
		// Wait for at least a heading or the greeting text
		await expect(page.locator('h1, [data-testid="greeting"]').first()).toBeVisible({ timeout: 8000 });
	});

	test('tests page renders with heading', async ({ page }) => {
		await page.goto('/tests');
		await expect(page.getByRole('heading', { name: 'Тесты' })).toBeVisible({ timeout: 8000 });
	});

	test('tests page shows scale list or empty message', async ({ page }) => {
		await page.goto('/tests');
		await expect(page.getByText('Нет назначенных тестов.')).toBeVisible({ timeout: 8000 });
	});

	test('medications page renders with log buttons or empty state', async ({ page }) => {
		await page.goto('/drugs');
		await expect(page.getByRole('heading', { name: 'Препараты' })).toBeVisible({ timeout: 8000 });
	});

	test('side effects page renders add button', async ({ page }) => {
		await page.goto('/side-effects');
		await expect(page.getByRole('button', { name: /Добавить/i })).toBeVisible({ timeout: 8000 });
	});

	test('profile page renders credential form', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible({ timeout: 8000 });
		await expect(page.getByText('Логин и пароль')).toBeVisible({ timeout: 8000 });
	});

	test('assessment page shows error for unknown id', async ({ page }) => {
		await page.goto('/assessment/00000000-0000-0000-0000-000000000000');
		await expect(page.locator('text=Тест не найден.').or(page.locator('text=Загрузка')).first()).toBeVisible({
			timeout: 8000,
		});
	});
});

// ---------------------------------------------------------------------------
// Doctor Portal
// ---------------------------------------------------------------------------

test.describe('Phase 08 — Doctor Portal', () => {
	let doctorTokens: TokenPair;
	let patientId: string;

	test.beforeAll(async () => {
		const email = `e2e-p08-doc-${Date.now()}@example.com`;
		const password = 'E2ePass123!';
		doctorTokens = await registerDoctor(email, password);

		const created = await apiPost<{ id: string }>(
			'/api/v1/doctor/patients',
			{ full_name: 'E2E Doctor View Patient' },
			doctorTokens.access_token
		);
		patientId = created.id;
	});

	test.beforeEach(async ({ page }) => {
		await page.addInitScript(
			({ key, version, data }) => {
				window.localStorage.setItem(key, JSON.stringify({ version, data }));
			},
			{ key: LS_AUTH_KEY, version: LS_VERSION, data: doctorTokens }
		);
	});

	test('patients list renders heading', async ({ page }) => {
		await page.goto('/doctor');
		await expect(page.getByRole('heading', { name: 'Пациенты' })).toBeVisible({ timeout: 8000 });
	});

	test('patients list shows patient card after creation', async ({ page }) => {
		await page.goto('/doctor');
		await expect(page.locator('text=E2E Doctor View Patient').first()).toBeVisible({ timeout: 8000 });
	});

	test('patient detail page renders with tabs', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await expect(page.locator('text=E2E Doctor View Patient').first()).toBeVisible({ timeout: 8000 });
		await expect(page.locator('text=Обзор').first()).toBeVisible({ timeout: 8000 });
		await expect(page.locator('text=Препараты').first()).toBeVisible({ timeout: 8000 });
		await expect(page.locator('text=Динамика').first()).toBeVisible({ timeout: 8000 });
	});

	test('patient detail — Препараты tab navigation works', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await page.locator('[data-slot="tabs-trigger"]', { hasText: 'Препараты' }).first().click();
		await expect(page.locator('text=Текущие препараты').first()).toBeVisible({ timeout: 8000 });
	});

	test('patient detail — Динамика tab navigation works', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await page.locator('[data-slot="tabs-trigger"]', { hasText: 'Динамика' }).first().click();
		await expect(page.locator('text=Назначенные шкалы').first()).toBeVisible({ timeout: 8000 });
	});
});
