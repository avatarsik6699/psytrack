import { describe, expect, it } from 'vitest';

import { computeDelta, computeSeverityLabel, formatWeekLabel } from '../app/shared/lib/score-utils';

describe('computeSeverityLabel', () => {
	it('PHQ-9 boundaries', () => {
		expect(computeSeverityLabel('PHQ-9', 0)).toBe('Minimal');
		expect(computeSeverityLabel('PHQ-9', 4)).toBe('Minimal');
		expect(computeSeverityLabel('PHQ-9', 5)).toBe('Mild');
		expect(computeSeverityLabel('PHQ-9', 9)).toBe('Mild');
		expect(computeSeverityLabel('PHQ-9', 10)).toBe('Moderate');
		expect(computeSeverityLabel('PHQ-9', 14)).toBe('Moderate');
		expect(computeSeverityLabel('PHQ-9', 15)).toBe('Mod. Severe');
		expect(computeSeverityLabel('PHQ-9', 19)).toBe('Mod. Severe');
		expect(computeSeverityLabel('PHQ-9', 20)).toBe('Severe');
		expect(computeSeverityLabel('PHQ-9', 27)).toBe('Severe');
	});

	it('GAD-7 boundaries', () => {
		expect(computeSeverityLabel('GAD-7', 0)).toBe('Minimal');
		expect(computeSeverityLabel('GAD-7', 4)).toBe('Minimal');
		expect(computeSeverityLabel('GAD-7', 5)).toBe('Mild');
		expect(computeSeverityLabel('GAD-7', 9)).toBe('Mild');
		expect(computeSeverityLabel('GAD-7', 10)).toBe('Moderate');
		expect(computeSeverityLabel('GAD-7', 14)).toBe('Moderate');
		expect(computeSeverityLabel('GAD-7', 15)).toBe('Severe');
		expect(computeSeverityLabel('GAD-7', 21)).toBe('Severe');
	});

	it('YMRS boundaries', () => {
		expect(computeSeverityLabel('YMRS', 0)).toBe('Minimal');
		expect(computeSeverityLabel('YMRS', 7)).toBe('Minimal');
		expect(computeSeverityLabel('YMRS', 8)).toBe('Mild');
		expect(computeSeverityLabel('YMRS', 15)).toBe('Mild');
		expect(computeSeverityLabel('YMRS', 16)).toBe('Moderate');
		expect(computeSeverityLabel('YMRS', 25)).toBe('Moderate');
		expect(computeSeverityLabel('YMRS', 26)).toBe('Severe');
	});

	it('unknown scale returns N/A', () => {
		expect(computeSeverityLabel('UNKNOWN', 10)).toBe('N/A');
	});
});

describe('computeDelta', () => {
	it('positive delta when score increases', () => {
		expect(computeDelta(18, 14)).toBe(4);
	});

	it('negative delta when score decreases (improvement on PHQ-9)', () => {
		expect(computeDelta(8, 14)).toBe(-6);
	});

	it('zero delta for unchanged score', () => {
		expect(computeDelta(10, 10)).toBe(0);
	});
});

describe('formatWeekLabel', () => {
	it('formats a date as "Mon WN"', () => {
		// 2026-02-01 is a Sunday, week 1 of February
		expect(formatWeekLabel('2026-02-01T00:00:00Z')).toMatch(/Feb W1/);
	});

	it('week 4 of a month', () => {
		// 2026-02-22 → Feb W4
		expect(formatWeekLabel('2026-02-22T00:00:00Z')).toMatch(/Feb W4/);
	});
});
