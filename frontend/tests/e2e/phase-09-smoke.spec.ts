/**
 * Phase 09 smoke — design-system completion and credential/profile flows.
 */
import { expect, request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';
const LS_AUTH_KEY = 'docassist.auth.token';
const LS_VERSION = 2;

type TokenPair = { access_token: string; refresh_token: string; token_type: string };
type CreatedPatient = { id: string; temp_login: string; temp_password: string; full_name: string };

async function apiContext() {
	return playwrightRequest.newContext({ baseURL: BACKEND_URL });
}

async function registerDoctor(email: string, password: string): Promise<TokenPair> {
	const ctx = await apiContext();
	const res = await ctx.post('/api/v1/public/auth/register', {
		data: { email, password, full_name: 'E2E Phase09 Doctor', consent_152fz: true },
	});
	if (!res.ok()) throw new Error(`Register failed ${res.status()}: ${await res.text()}`);
	const tokens = (await res.json()) as TokenPair;
	await ctx.dispose();
	return tokens;
}

async function patientLogin(login: string, password: string): Promise<TokenPair> {
	const ctx = await apiContext();
	const res = await ctx.post('/api/v1/public/auth/patient-login', { data: { temp_login: login, password } });
	if (!res.ok()) throw new Error(`Patient login failed ${res.status()}: ${await res.text()}`);
	const tokens = (await res.json()) as TokenPair;
	await ctx.dispose();
	return tokens;
}

async function createPatient(token: string): Promise<CreatedPatient> {
	const ctx = await apiContext();
	const res = await ctx.post('/api/v1/doctor/patients', {
		data: { full_name: 'E2E Phase09 Patient' },
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok()) throw new Error(`Create patient failed ${res.status()}: ${await res.text()}`);
	const patient = (await res.json()) as CreatedPatient;
	await ctx.dispose();
	return patient;
}

async function seedAuth(page: import('@playwright/test').Page, tokens: TokenPair) {
	await page.addInitScript(
		({ key, version, data }) => {
			window.localStorage.setItem(key, JSON.stringify({ version, data }));
		},
		{ key: LS_AUTH_KEY, version: LS_VERSION, data: tokens }
	);
}

test.describe('Phase 09 — public auth', () => {
	test('login exposes doctor and patient modes without app role-switch links', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: 'Добро пожаловать' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Врач' })).toBeVisible();
		await page.getByRole('button', { name: 'Пациент' }).click();
		await expect(page.getByLabel('Логин')).toBeVisible();
		await expect(page.getByRole('link', { name: /Зарегистрироваться|Регистрация/i })).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Врач' })).toHaveCount(0);
	});

	test('register route is closed for MVP and redirects to login', async ({ page }) => {
		await page.goto('/register');
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('heading', { name: 'Добро пожаловать' })).toBeVisible();
	});
});

test.describe('Phase 09 — patient portal', () => {
	let doctorTokens: TokenPair;
	let patient: CreatedPatient;
	let patientTokens: TokenPair;

	test.beforeAll(async () => {
		doctorTokens = await registerDoctor(`e2e-p09-patient-${Date.now()}@example.com`, 'E2ePass123!');
		patient = await createPatient(doctorTokens.access_token);
		patientTokens = await patientLogin(patient.temp_login, patient.temp_password);
	});

	test.beforeEach(async ({ page }) => {
		await seedAuth(page, patientTokens);
	});

	test('history uses the real history route and empty state', async ({ page }) => {
		await page.goto('/history');
		await expect(page.getByRole('heading', { name: 'История тестов' })).toBeVisible({ timeout: 8000 });
		await expect(page.getByText('Завершенных тестов пока нет.')).toBeVisible();
	});

	test('profile shows credential controls and current session', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByText('Логин и пароль')).toBeVisible({ timeout: 8000 });
		await expect(page.getByText(patient.temp_login)).toBeVisible();
		await expect(page.getByText('Текущая сессия')).toBeVisible();
	});

	test('patient mobile navigation is visible at narrow width', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 820 });
		await page.goto('/dashboard');
		await expect(page.getByRole('link', { name: /Профиль/i })).toBeVisible({ timeout: 8000 });
	});
});

test.describe('Phase 09 — doctor portal', () => {
	let doctorTokens: TokenPair;
	let patient: CreatedPatient;

	test.beforeAll(async () => {
		doctorTokens = await registerDoctor(`e2e-p09-doctor-${Date.now()}@example.com`, 'E2ePass123!');
		patient = await createPatient(doctorTokens.access_token);
	});

	test.beforeEach(async ({ page }) => {
		await seedAuth(page, doctorTokens);
	});

	test('doctor profile renders session and preferences', async ({ page }) => {
		await page.goto('/doctor/profile');
		await expect(page.getByRole('heading', { name: 'Профиль врача' })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('heading', { name: 'Токен доступа' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Интерфейс' })).toBeVisible();
	});

	test('doctor can open credential reset flow and see one-time credentials', async ({ page }) => {
		await page.goto(`/doctor/patients/${patient.id}`);
		await page.getByRole('button', { name: /Сбросить доступ/i }).click();
		await expect(page.getByRole('heading', { name: 'Новые данные пациента' })).toBeVisible();
		await page.getByRole('button', { name: 'Сгенерировать' }).click();
		await expect(page.getByText(/login:/)).toBeVisible({ timeout: 8000 });
		await expect(page.getByText(/password:/)).toBeVisible();
	});

	test('doctor mobile navigation has no settings or schedule links', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 820 });
		await page.goto('/doctor');
		await expect(page.getByRole('link', { name: /Пациенты/i })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('link', { name: /Профиль/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Настройки/i })).toHaveCount(0);
	});
});
