import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { date } from '@shared/lib/date';

describe('date.formatDateRu', () => {
	it('formats Friday May 22 2026 correctly', () => {
		// new Date(year, monthIndex, day) is local-time — deterministic across timezones
		const d = new Date(2026, 4, 22); // May 22, 2026 — Friday
		expect(date.formatDateRu(d)).toBe('пятница, 22 мая 2026');
	});

	it('formats Sunday January 4 2026 correctly', () => {
		const d = new Date(2026, 0, 4); // Jan 4, 2026 — Sunday
		expect(date.formatDateRu(d)).toBe('воскресенье, 4 января 2026');
	});

	it('formats December correctly', () => {
		const d = new Date(2025, 11, 31); // Dec 31, 2025 — Wednesday
		expect(date.formatDateRu(d)).toBe('среда, 31 декабря 2025');
	});
});

describe('date.todayLabelRu', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns capitalised day label for May 22 2026', () => {
		// Use noon UTC so getDate/getMonth/getFullYear are May 22 in any UTC±11 timezone
		vi.setSystemTime(new Date('2026-05-22T12:00:00Z'));
		const label = date.todayLabelRu();
		// First character must be uppercase
		expect(label[0]).toBe(label[0]?.toUpperCase());
		// Must contain the year
		expect(label).toContain('2026');
		// Must contain the Russian month
		expect(label).toContain('мая');
	});
});

describe('date.formatMonthShortRu', () => {
	it('formats January 15', () => {
		// Use noon UTC to avoid timezone edge cases
		expect(date.formatMonthShortRu('2025-01-15T12:00:00Z')).toBe('15 янв.');
	});

	it('formats May 22', () => {
		expect(date.formatMonthShortRu('2025-05-22T12:00:00Z')).toBe('22 мая');
	});

	it('formats December 31', () => {
		expect(date.formatMonthShortRu('2025-12-31T12:00:00Z')).toBe('31 дек.');
	});

	it('returns "—" for null', () => {
		expect(date.formatMonthShortRu(null)).toBe('—');
	});

	it('returns "—" for undefined', () => {
		expect(date.formatMonthShortRu(undefined)).toBe('—');
	});

	it('returns "—" for empty string', () => {
		expect(date.formatMonthShortRu('')).toBe('—');
	});

	it('returns "—" for an unparseable string', () => {
		expect(date.formatMonthShortRu('not-a-date')).toBe('—');
	});
});

describe('date.todayIso', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns today in YYYY-MM-DD format', () => {
		vi.setSystemTime(new Date('2026-05-22T12:00:00Z'));
		const iso = date.todayIso();
		// Format check: must match YYYY-MM-DD
		expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		// The value must be sliced from the ISO string (UTC date)
		expect(iso).toBe('2026-05-22');
	});
});
