// Severity threshold tables for interpreting scale scores.
// Each entry: [maxScore, label]. Scores above the last threshold → "Тяжёлая".
export const SEVERITY_THRESHOLDS: Record<string, [number, string][]> = {
	'PHQ-9': [
		[4, 'Минимальная'],
		[9, 'Лёгкая'],
		[14, 'Умеренная'],
		[19, 'Умеренно-тяжёлая'],
	],
	'GAD-7': [
		[4, 'Минимальная'],
		[9, 'Лёгкая'],
		[14, 'Умеренная'],
	],
	YMRS: [
		[7, 'Минимальная'],
		[15, 'Лёгкая'],
		[25, 'Умеренная'],
	],
};
