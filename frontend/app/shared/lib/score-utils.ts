const PHQ9_THRESHOLDS: [number, string][] = [
	[4, 'Minimal'],
	[9, 'Mild'],
	[14, 'Moderate'],
	[19, 'Mod. Severe'],
];
const GAD7_THRESHOLDS: [number, string][] = [
	[4, 'Minimal'],
	[9, 'Mild'],
	[14, 'Moderate'],
];
const YMRS_THRESHOLDS: [number, string][] = [
	[7, 'Minimal'],
	[15, 'Mild'],
	[25, 'Moderate'],
];

const SEVERITY_TABLES: Record<string, [number, string][]> = {
	'PHQ-9': PHQ9_THRESHOLDS,
	'GAD-7': GAD7_THRESHOLDS,
	YMRS: YMRS_THRESHOLDS,
};

export function computeSeverityLabel(scaleCode: string, score: number): string {
	const table = SEVERITY_TABLES[scaleCode];
	if (!table) return 'N/A';
	for (const [threshold, label] of table) {
		if (score <= threshold) return label;
	}
	return 'Severe';
}

export function computeDelta(current: number, previous: number): number {
	return current - previous;
}

/** Format an ISO datetime string as "MMM WN" — e.g. "Feb W1" */
export function formatWeekLabel(isoDate: string): string {
	const d = new Date(isoDate);
	const month = d.toLocaleString('en', { month: 'short' });
	const weekOfMonth = Math.ceil(d.getDate() / 7);
	return `${month} W${weekOfMonth}`;
}
