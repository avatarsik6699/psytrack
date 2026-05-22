import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';

// ---------------------------------------------------------------------------
// Storage factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test key definition
// ---------------------------------------------------------------------------

type Payload = { value: string };

function isPayload(v: unknown): v is Payload {
	return (
		typeof v === 'object' && v !== null && 'value' in v && typeof (v as Record<string, unknown>).value === 'string'
	);
}

const TEST_KEY: SafeLsTypes.Key<Payload> = {
	key: 'test.safe-ls.key',
	version: 1,
	guard: isPayload,
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('safeLs (with stubbed window)', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = createStorage();
		vi.stubGlobal('window', { localStorage: storage });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('get returns null when storage is empty', () => {
		expect(safeLs.get(TEST_KEY)).toBeNull();
	});

	it('set and get round-trips correctly', () => {
		safeLs.set(TEST_KEY, { value: 'hello' });
		expect(safeLs.get(TEST_KEY)).toEqual({ value: 'hello' });
	});

	it('set writes a versioned envelope to localStorage', () => {
		safeLs.set(TEST_KEY, { value: 'stored' });
		const raw = storage.getItem(TEST_KEY.key);
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw ?? '');
		expect(parsed).toEqual({ version: 1, data: { value: 'stored' } });
	});

	it('remove clears the stored value', () => {
		safeLs.set(TEST_KEY, { value: 'to-remove' });
		safeLs.remove(TEST_KEY);
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);
	});

	it('get returns null and removes the entry when version mismatches', () => {
		storage.setItem(TEST_KEY.key, JSON.stringify({ version: 99, data: { value: 'x' } }));
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);
	});

	it('get returns null and removes the entry when data fails the type guard', () => {
		storage.setItem(TEST_KEY.key, JSON.stringify({ version: 1, data: { value: 42 } }));
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);
	});

	it('get returns null and removes the entry for invalid JSON', () => {
		storage.setItem(TEST_KEY.key, '{broken json');
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);
	});
});

describe('safeLs (without window — SSR-like environment)', () => {
	beforeEach(() => {
		// Ensure window is undefined so localStorage access throws
		vi.unstubAllGlobals();
	});

	it('get returns null gracefully when window is unavailable', () => {
		expect(safeLs.get(TEST_KEY)).toBeNull();
	});

	it('set does not throw when window is unavailable', () => {
		expect(() => safeLs.set(TEST_KEY, { value: 'x' })).not.toThrow();
	});

	it('remove does not throw when window is unavailable', () => {
		expect(() => safeLs.remove(TEST_KEY)).not.toThrow();
	});
});
