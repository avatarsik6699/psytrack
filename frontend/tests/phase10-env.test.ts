import { afterEach, describe, expect, it, vi } from 'vitest';

describe('phase 10 production env handling', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it('normalizes API bases that already include /api/v1', async () => {
		const { normalizeApiBaseUrl } = await import('../app/shared/config/env');

		expect(normalizeApiBaseUrl('https://psycker.ru/api/v1')).toBe('https://psycker.ru/');
		expect(normalizeApiBaseUrl('https://psycker.ru/api/v1/')).toBe('https://psycker.ru/');
	});

	it('requires VITE_API_BASE_URL in production builds', async () => {
		vi.stubEnv('PROD', true);
		vi.stubEnv('VITE_API_BASE_URL', undefined);

		await expect(import('../app/shared/config/env')).rejects.toThrow('VITE_API_BASE_URL is required');
	});

	it('accepts the production API base URL', async () => {
		vi.stubEnv('PROD', true);
		vi.stubEnv('VITE_API_BASE_URL', 'https://psycker.ru');

		const { env } = await import('../app/shared/config/env');

		expect(env.client.apiBaseUrl).toBe('https://psycker.ru/');
	});
});
