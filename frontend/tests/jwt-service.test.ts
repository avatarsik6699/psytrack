import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authQueryKeys } from '@shared/api/keys';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const STORAGE_KEY = 'docassist.auth.token';

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

function stubWindow(storage: Storage): void {
	vi.stubGlobal('window', { localStorage: storage });
}

const tokenPair = {
	access_token: 'access-token',
	refresh_token: 'refresh-token',
	token_type: 'bearer',
} satisfies TokenPair;

describe('jwtService', () => {
	let queryClient: QueryClient;
	let storage: Storage;

	beforeEach(() => {
		queryClient = new QueryClient();
		storage = createStorage();
		stubWindow(storage);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('stores a token pair in query cache and localStorage envelope', () => {
		jwtService.set(queryClient, tokenPair);

		expect(queryClient.getQueryData(authQueryKeys.token)).toEqual(tokenPair);
		expect(storage.setItem).toHaveBeenCalledTimes(1);

		const raw = storage.getItem(STORAGE_KEY);
		expect(raw).not.toBeNull();
		expect(JSON.parse(raw ?? '')).toEqual({
			version: 2,
			data: tokenPair,
		});
	});

	it('hydrates a valid persisted token pair into query cache', () => {
		storage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: 2,
				data: tokenPair,
			})
		);

		jwtService.hydrate(queryClient);

		expect(queryClient.getQueryData(authQueryKeys.token)).toEqual(tokenPair);
	});

	it('removes persisted tokens when persisting null', () => {
		jwtService.persist(tokenPair);

		jwtService.persist(null);

		expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
		expect(jwtService.read()).toBeNull();
	});

	it.each([
		['invalid JSON', '{'],
		[
			'wrong version',
			JSON.stringify({
				version: 1,
				data: tokenPair,
			}),
		],
		[
			'invalid token shape',
			JSON.stringify({
				version: 2,
				data: {
					access_token: 'access-token',
					refresh_token: 'refresh-token',
					token_type: 'not-bearer',
				},
			}),
		],
	])('returns null and clears storage for %s', (_label, raw) => {
		storage.setItem(STORAGE_KEY, raw);

		expect(jwtService.read()).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});

	it('does not throw when localStorage is unavailable', () => {
		vi.unstubAllGlobals();

		expect(() => jwtService.persist(tokenPair)).not.toThrow();
		expect(() => jwtService.persist(null)).not.toThrow();
		expect(jwtService.read()).toBeNull();
	});
});
