/**
 * Phase 02 smoke — Patient Management
 *
 * Requires the full stack to be running:
 *   Backend  → BACKEND_URL  (default http://localhost:8000)
 *   Frontend → PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *
 * Auth state is seeded via localStorage before each test so no UI login flow
 * is needed, keeping tests fast and isolated from the auth module.
 */
import { execFileSync } from 'node:child_process';

import { expect, request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

/** localStorage key / envelope format used by jwtService (version 2). */
const LS_AUTH_KEY = 'docassist.auth.token';
const LS_VERSION = 2;

type TokenPair = { access_token: string; refresh_token: string; token_type: string };

async function registerDoctor(email: string, password: string): Promise<void> {
	execFileSync('docker', [
		'compose',
		'exec',
		'-T',
		'backend',
		'uv',
		'run',
		'python',
		'scripts/create-doctor.py',
		'--email',
		email,
		'--full-name',
		'E2E Doctor P02',
		'--password',
		password,
	]);
}

async function loginDoctor(email: string, password: string): Promise<TokenPair> {
	const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
	const res = await ctx.post('/api/v1/public/auth/login', {
		data: { email, password },
	});
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

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Phase 02 — Patient Management', () => {
	let tokens: TokenPair;

	test.beforeAll(async () => {
		const email = `e2e-p02-${Date.now()}@example.com`;
		const password = 'E2ePass123!';
		await registerDoctor(email, password);
		tokens = await loginDoctor(email, password);
	});

	/** Seeds the versioned localStorage envelope the app reads on load. */
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(
			({ key, version, data }) => {
				window.localStorage.setItem(key, JSON.stringify({ version, data }));
			},
			{ key: LS_AUTH_KEY, version: LS_VERSION, data: tokens }
		);
	});

	// -------------------------------------------------------------------------
	// Roster
	// -------------------------------------------------------------------------

	test('doctor roster renders at /doctor', async ({ page }) => {
		await page.goto('/doctor');
		await expect(page.getByRole('heading', { name: 'Пациенты' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Добавить пациента/i })).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// Add-patient modal
	// -------------------------------------------------------------------------

	test('Add Patient modal creates a patient and shows temp credentials', async ({ page }) => {
		await page.goto('/doctor');

		// Open modal
		await page.getByRole('button', { name: /Добавить пациента/i }).click();
		await expect(page.getByRole('heading', { name: 'Имя пациента' })).toBeVisible();

		await page.getByPlaceholder('Фамилия Имя Отчество').fill('E2E Test Patient');
		await page.getByRole('button', { name: /Далее/i }).click();

		await expect(page.getByRole('heading', { name: 'Данные пациента' })).toBeVisible();
		await page.locator('input[type="date"]').fill('1990-06-15');
		await page.getByRole('button', { name: /Далее/i }).click();

		await expect(page.getByRole('heading', { name: 'Подтверждение' })).toBeVisible();
		await page.getByRole('button', { name: 'Создать пациента' }).click();

		// Credentials panel appears with Login and Password copy-fields
		await expect(page.getByText('Пациент добавлен')).toBeVisible();
		await expect(page.getByText('Логин')).toBeVisible();
		await expect(page.getByText('Пароль')).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// Patient detail
	// -------------------------------------------------------------------------

	test('patient detail page shows name, diagnoses section, medications section', async ({ page }) => {
		// Create patient via API so the test is independent of the modal test above
		const patient = await apiPost<{ id: string; full_name: string }>(
			'/api/v1/doctor/patients',
			{ full_name: 'E2E Detail Patient', birth_date: '1985-06-20', gender: 'male' },
			tokens.access_token
		);

		await page.goto(`/doctor/patients/${patient.id}`);

		// Patient name headline
		await expect(page.getByRole('heading', { name: patient.full_name })).toBeVisible();

		// Archive button present (patient is not yet archived)
		await expect(page.getByRole('button', { name: /Архив/i })).toBeVisible();

		// Diagnoses section heading
		await expect(page.getByRole('heading', { name: /Диагнозы/i }).first()).toBeVisible();

		// Medications section heading
		await expect(page.getByRole('heading', { name: /Препараты/i }).first()).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// Medications reference search
	// -------------------------------------------------------------------------

	test('ref/medications endpoint returns seeded data', async () => {
		const ctx = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
		const res = await ctx.get('/api/v1/ref/medications?q=sertr', {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});
		expect(res.ok()).toBe(true);
		const body = (await res.json()) as { inn: string }[];
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThan(0);
		expect(body[0].inn).toMatch(/sertraline/i);
		await ctx.dispose();
	});
});
