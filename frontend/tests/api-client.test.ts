import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiError } from '@shared/api/client';
import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import { queryClient } from '@shared/api/query-client';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const STORAGE_KEY = 'docassist.auth.token';

const expiredTokens = {
	access_token: 'expired-access',
	refresh_token: 'refresh-token',
	token_type: 'bearer',
} satisfies TokenPair;

const refreshedTokens = {
	access_token: 'fresh-access',
	refresh_token: 'fresh-refresh',
	token_type: 'bearer',
} satisfies TokenPair;

function createStorage(): Storage {
	const values = new Map<string, string>();

	return {
		get length() {
			return values.size;
		},
		clear: vi.fn(() => values.clear()),
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
		removeItem: vi.fn((key: string) => {
			values.delete(key);
		}),
		setItem: vi.fn((key: string, value: string) => {
			values.set(key, value);
		}),
	};
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	return new Response(JSON.stringify(body), {
		...init,
		headers,
	});
}

function textResponse(body: string, init: ResponseInit = {}): Response {
	return new Response(body, init);
}

function stubWindow(storage: Storage): void {
	vi.stubGlobal('window', { localStorage: storage });
}

function readRequestInit(callIndex: number): RequestInit {
	const init = fetchMock.mock.calls[callIndex]?.[1];
	if (!init) throw new Error(`Missing fetch init for call ${callIndex}`);
	return init;
}

function readRequestHeaders(callIndex: number): Headers {
	return readRequestInit(callIndex).headers as Headers;
}

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let storage: Storage;

describe('api client', () => {
	beforeEach(() => {
		queryClient.clear();
		storage = createStorage();
		stubWindow(storage);
		fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		queryClient.clear();
		vi.unstubAllGlobals();
	});

	it('builds GET URLs with query params and returns JSON', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }));

		await expect(
			api.get('/api/v1/health', {
				query: {
					search: 'doctor one',
					page: 2,
					active: true,
					skip: null,
					omit: undefined,
				},
			})
		).resolves.toEqual({ status: 'ok', db: 'connected' });

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
		expect(url.toString()).toBe('http://localhost:8000/api/v1/health?search=doctor+one&page=2&active=true');
		expect(readRequestInit(0).method).toBe('GET');
	});

	it('serializes POST JSON bodies and sets Content-Type', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(refreshedTokens));

		await api.post('/api/v1/public/auth/login', {
			body: {
				email: 'doctor@example.test',
				password: 'testPass1!',
			},
		});

		expect(readRequestInit(0).method).toBe('POST');
		expect(readRequestHeaders(0).get('Content-Type')).toBe('application/json');
		expect(readRequestInit(0).body).toBe(JSON.stringify({ email: 'doctor@example.test', password: 'testPass1!' }));
	});

	it('resolves path params for raw form requests and does not force JSON Content-Type', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
		const formData = new FormData();
		formData.set('avatar', 'payload');

		await api.postForm('/api/v1/users/{userId}/avatar', {
			formData,
			params: {
				path: { userId: 'doctor/one' },
			},
		});

		expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8000/api/v1/users/doctor%2Fone/avatar');
		expect(readRequestHeaders(0).has('Content-Type')).toBe(false);
		expect(readRequestInit(0).body).toBe(formData);
	});

	it('adds the cached access token as Authorization', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }));

		await api.get('/api/v1/health');

		expect(readRequestHeaders(0).get('Authorization')).toBe('Bearer expired-access');
	});

	it('does not overwrite a caller-provided Authorization header', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }));

		await api.get('/api/v1/health', {
			headers: {
				Authorization: 'Bearer custom-token',
			},
		});

		expect(readRequestHeaders(0).get('Authorization')).toBe('Bearer custom-token');
	});

	it('returns undefined for 204 responses', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

		await expect(api.delete('/api/v1/public/auth/me')).resolves.toBeUndefined();
	});

	it('throws ApiError with JSON detail and request id for non-401 errors', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(
				{ detail: 'Forbidden' },
				{
					status: 403,
					headers: { 'X-Request-ID': 'request-1' },
				}
			)
		);

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 403,
			detail: { detail: 'Forbidden' },
			requestId: 'request-1',
		} satisfies Partial<ApiError>);
	});

	it('throws ApiError with text detail when error response is not JSON', async () => {
		fetchMock.mockResolvedValueOnce(textResponse('Service unavailable', { status: 503 }));

		await expect(api.get('/api/v1/health')).rejects.toMatchObject({
			status: 503,
			detail: 'Service unavailable',
		} satisfies Partial<ApiError>);
	});

	it('refreshes tokens on 401, persists them, and retries with the new access token', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse(refreshedTokens))
			.mockResolvedValueOnce(jsonResponse({ id: 'user-1', role: 'doctor' }));

		await expect(api.get('/api/v1/public/auth/me')).resolves.toEqual({ id: 'user-1', role: 'doctor' });

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:8000/api/v1/public/auth/refresh');
		expect(readRequestInit(1).body).toBe(JSON.stringify({ refresh_token: 'refresh-token' }));
		expect(readRequestHeaders(2).get('Authorization')).toBe('Bearer fresh-access');
		expect(queryClient.getQueryData(authQueryKeys.token)).toEqual(refreshedTokens);
		expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
			version: 2,
			data: refreshedTokens,
		});
	});

	it('uses a single refresh request for parallel 401 responses', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse(refreshedTokens))
			.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }))
			.mockResolvedValueOnce(jsonResponse({ id: 'user-1', role: 'doctor' }));

		await expect(Promise.all([api.get('/api/v1/health'), api.get('/api/v1/public/auth/me')])).resolves.toEqual([
			{ status: 'ok', db: 'connected' },
			{ id: 'user-1', role: 'doctor' },
		]);

		const refreshCalls = fetchMock.mock.calls.filter(
			([url]) => url === 'http://localhost:8000/api/v1/public/auth/refresh'
		);
		expect(refreshCalls).toHaveLength(1);
		expect(readRequestHeaders(3).get('Authorization')).toBe('Bearer fresh-access');
		expect(readRequestHeaders(4).get('Authorization')).toBe('Bearer fresh-access');
	});

	it('clears tokens and propagates the original 401 when refresh returns an error', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse({ detail: 'Invalid refresh' }, { status: 401 }));

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 401,
			detail: { detail: 'Expired' },
		} satisfies Partial<ApiError>);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(queryClient.getQueryData(authQueryKeys.token)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});

	it('clears tokens and propagates the original 401 when refresh has a network error', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockRejectedValueOnce(new Error('network down'));

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 401,
			detail: { detail: 'Expired' },
		} satisfies Partial<ApiError>);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(queryClient.getQueryData(authQueryKeys.token)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});

	it('does not refresh when no refresh token is available', async () => {
		queryClient.setQueryData(authQueryKeys.token, {
			access_token: 'expired-access',
			refresh_token: '',
			token_type: 'bearer',
		} satisfies TokenPair);
		fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }));

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 401,
			detail: { detail: 'Expired' },
		} satisfies Partial<ApiError>);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('does not recursively refresh a 401 from the refresh endpoint itself', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Invalid refresh' }, { status: 401 }));

		await expect(
			api.post('/api/v1/public/auth/refresh', {
				body: {
					refresh_token: 'refresh-token',
				},
			})
		).rejects.toMatchObject({
			status: 401,
			detail: { detail: 'Invalid refresh' },
		} satisfies Partial<ApiError>);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('throws the retry response ApiError when retry fails after a successful refresh', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse(refreshedTokens))
			.mockResolvedValueOnce(
				jsonResponse(
					{ detail: 'Still unauthorized' },
					{
						status: 403,
						headers: { 'X-Request-ID': 'retry-request' },
					}
				)
			);

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 403,
			detail: { detail: 'Still unauthorized' },
			requestId: 'retry-request',
		} satisfies Partial<ApiError>);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(queryClient.getQueryData(authQueryKeys.token)).toEqual(refreshedTokens);
	});
});
