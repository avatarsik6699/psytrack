import { describe, expect, it } from 'vitest';

import { safeJson } from '@shared/lib/safe-json';

function isString(v: unknown): v is string {
	return typeof v === 'string';
}

type NumberRecord = { count: number };

function isNumberRecord(v: unknown): v is NumberRecord {
	return (
		typeof v === 'object' && v !== null && 'count' in v && typeof (v as Record<string, unknown>).count === 'number'
	);
}

describe('safeJson.parse', () => {
	it('returns parsed value when guard passes', () => {
		expect(safeJson.parse('"hello"', isString)).toBe('hello');
	});

	it('returns null when type guard rejects the parsed value', () => {
		expect(safeJson.parse('42', isString)).toBeNull();
	});

	it('returns null for invalid JSON', () => {
		expect(safeJson.parse('{invalid}', isString)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(safeJson.parse('', isString)).toBeNull();
	});

	it('parses an object and validates it', () => {
		expect(safeJson.parse('{"count":5}', isNumberRecord)).toEqual({ count: 5 });
	});

	it('returns null when object shape fails the guard', () => {
		expect(safeJson.parse('{"count":"not-a-number"}', isNumberRecord)).toBeNull();
	});

	it('returns null for JSON null', () => {
		// JSON.parse('null') returns null; guard(null) → false for isString
		expect(safeJson.parse('null', isString)).toBeNull();
	});
});

describe('safeJson.stringify', () => {
	it('serializes a plain object', () => {
		expect(safeJson.stringify({ key: 'value' })).toBe('{"key":"value"}');
	});

	it('serializes a string', () => {
		expect(safeJson.stringify('hello')).toBe('"hello"');
	});

	it('serializes null', () => {
		expect(safeJson.stringify(null)).toBe('null');
	});

	it('serializes an array', () => {
		expect(safeJson.stringify([1, 2, 3])).toBe('[1,2,3]');
	});

	it('returns null for a circular reference', () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		expect(safeJson.stringify(circular)).toBeNull();
	});
});
