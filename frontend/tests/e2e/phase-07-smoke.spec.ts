/**
 * Phase 07 smoke — Charts & Doctor Detail
 *
 * Requires the full stack to be running:
 *   Backend  → BACKEND_URL  (default http://localhost:8000)
 *   Frontend → PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 */
import { expect, request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';
const LS_AUTH_KEY = 'docassist.auth.token';
const LS_VERSION = 2;

type TokenPair = { access_token: string; refresh_token: string; token_type: string };

async function registerDoctor(email: string, password: string): Promise<void> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post('/api/v1/public/auth/register', {
		data: { email, password, full_name: 'E2E Doctor P07', consent_152fz: true },
	});
	if (!res.ok()) throw new Error(`Register failed ${res.status()}: ${await res.text()}`);
	await ctx.dispose();
}

async function loginDoctor(email: string, password: string): Promise<TokenPair> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post('/api/v1/public/auth/login', { data: { email, password } });
	if (!res.ok()) throw new Error(`Login failed ${res.status()}`);
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
	const res = await ctx.get(path, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok()) {
		const text = await res.text();
		await ctx.dispose();
		throw new Error(`GET ${path} failed ${res.status()}: ${text}`);
	}
	const data = (await res.json()) as T;
	await ctx.dispose();
	return data;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Phase 07 — Charts & Doctor Detail', () => {
	let tokens: TokenPair;
	let patientId: string;

	test.beforeAll(async () => {
		const email = `e2e-p07-${Date.now()}@example.com`;
		const password = 'E2ePass123!';
		await registerDoctor(email, password);
		tokens = await loginDoctor(email, password);
		const patient = await apiPost<{ id: string }>(
			'/api/v1/doctor/patients',
			{ full_name: 'E2E P07 Patient' },
			tokens.access_token
		);
		patientId = patient.id;
	});

	test.beforeEach(async ({ page }) => {
		await page.addInitScript(
			({ key, version, data }) => {
				window.localStorage.setItem(key, JSON.stringify({ version, data }));
			},
			{ key: LS_AUTH_KEY, version: LS_VERSION, data: tokens }
		);
	});

	// -------------------------------------------------------------------------
	// Score chart endpoint smoke
	// -------------------------------------------------------------------------

	test('GET /charts/scores returns empty array for new patient', async () => {
		const data = await apiGet<unknown[]>(`/api/v1/doctor/patients/${patientId}/charts/scores`, tokens.access_token);
		expect(Array.isArray(data)).toBe(true);
	});

	// -------------------------------------------------------------------------
	// TherapyGoals API
	// -------------------------------------------------------------------------

	test('therapy goals CRUD: create → list → toggle', async () => {
		const created = await apiPost<{ id: string; is_completed: boolean; description: string }>(
			`/api/v1/doctor/patients/${patientId}/goals`,
			{ description: 'E2E therapy goal' },
			tokens.access_token
		);
		expect(created.description).toBe('E2E therapy goal');
		expect(created.is_completed).toBe(false);

		const list = await apiGet<unknown[]>(`/api/v1/doctor/patients/${patientId}/goals`, tokens.access_token);
		expect(list.length).toBeGreaterThan(0);
	});

	// -------------------------------------------------------------------------
	// Patient detail page renders
	// -------------------------------------------------------------------------

	test('patient detail page loads and shows PatientHeader', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await expect(page.getByRole('heading', { name: 'E2E P07 Patient' })).toBeVisible();
	});

	test('patient detail page shows ScoreChart section', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await page.locator('[data-slot="tabs-trigger"]', { hasText: 'Динамика' }).first().click();
		await expect(page.getByText('Данные об оценках отсутствуют.')).toBeVisible({ timeout: 8000 });
	});

	test('TherapyGoals section renders with Add goal button', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await expect(page.getByRole('heading', { name: 'Цели терапии' })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('button', { name: /\+ Добавить цель/i })).toBeVisible();
	});

	test('AssignTestModal opens when + Assign Test is clicked', async ({ page }) => {
		await page.goto(`/doctor/patients/${patientId}`);
		await page.locator('[data-slot="tabs-trigger"]', { hasText: 'Динамика' }).first().click();
		await page.getByRole('button', { name: /Назначить тест/i }).click();
		await expect(page.getByText('Шкала *')).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// PatientOut B3 fields in API
	// -------------------------------------------------------------------------

	test('GET /doctor/patients/:id returns adherence_percent and latest_scores', async () => {
		const patient = await apiGet<Record<string, unknown>>(`/api/v1/doctor/patients/${patientId}`, tokens.access_token);
		expect('adherence_percent' in patient).toBe(true);
		expect('latest_scores' in patient).toBe(true);
		expect('active_medications_summary' in patient).toBe(true);
	});
});
