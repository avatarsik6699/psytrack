// Unified date formatting helpers for the patient-tracker frontend.
// All components must use these instead of inline Date / Intl calls.
// See docs/FRONTEND_CONVENTIONS.md § 7 Date Formatting.

const WEEKDAYS_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'] as const;

const MONTHS_RU = [
	'января',
	'февраля',
	'марта',
	'апреля',
	'мая',
	'июня',
	'июля',
	'августа',
	'сентября',
	'октября',
	'ноября',
	'декабря',
] as const;

const MONTHS_SHORT_RU = [
	'янв.',
	'фев.',
	'мар.',
	'апр.',
	'мая',
	'июн.',
	'июл.',
	'авг.',
	'сен.',
	'окт.',
	'ноя.',
	'дек.',
] as const;

/**
 * "пятница, 23 мая 2025"
 * Used for the dashboard greeting header.
 */
function formatDateRu(d: Date): string {
	return `${WEEKDAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * "Пятница, 23 мая 2025" (capitalised weekday)
 * Used for the medications page subtitle.
 */
function todayLabelRu(): string {
	const d = new Date();
	const day = `${WEEKDAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
	return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * "15 янв." from an ISO date string or null/undefined.
 * Returns "—" for missing / unparseable values.
 */
function formatMonthShortRu(iso: string | null | undefined): string {
	if (!iso) {
		return '—';
	}

	const d = new Date(iso);

	if (isNaN(d.getTime())) {
		return '—';
	}

	return `${d.getDate()} ${MONTHS_SHORT_RU[d.getMonth()]}`;
}

/**
 * Today as "YYYY-MM-DD" (local time), e.g. "2025-05-23".
 * Used as default for date-picker inputs.
 */
function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

function now(): Date {
	return new Date();
}

function nowIso(): string {
	return new Date().toISOString();
}

function isDateOnOrAfterToday(iso: string | null | undefined): boolean {
	if (!iso) {
		return true;
	}

	const d = new Date(iso);

	if (isNaN(d.getTime())) {
		return false;
	}

	return d >= new Date();
}

function ageLabel(birthDate: string | null | undefined): string {
	if (!birthDate) {
		return '';
	}

	const today = new Date();
	const dob = new Date(birthDate);

	if (isNaN(dob.getTime())) {
		return '';
	}

	let age = today.getFullYear() - dob.getFullYear();
	if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
		age--;
	}

	return `${age} лет`;
}

/**
 * "23.05.25, 14:30" from an ISO datetime string.
 * Used in event timelines and audit logs.
 * Returns "—" for missing / unparseable values.
 */
function formatDateTimeRu(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function timestamp(iso: string | null | undefined): number {
	if (!iso) return 0;
	const d = new Date(iso);
	if (isNaN(d.getTime())) return 0;
	return d.getTime();
}

export const date = {
	formatDateRu,
	todayLabelRu,
	formatMonthShortRu,
	todayIso,
	now,
	nowIso,
	isDateOnOrAfterToday,
	ageLabel,
	formatDateTimeRu,
	timestamp,
} as const;
