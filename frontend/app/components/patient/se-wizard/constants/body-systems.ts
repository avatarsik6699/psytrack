export const BODY_SYSTEMS = [
	{ key: '', label: 'Все' },
	{ key: 'psychic', label: 'Психические' },
	{ key: 'neurological', label: 'Неврологические' },
	{ key: 'autonomic', label: 'Вегетативные' },
	{ key: 'global', label: 'Глобальные' },
	{ key: 'tardive', label: 'Поздние' },
	{ key: 'other', label: 'Другое' },
] as const;

export const SEVERITY_LABELS: Record<number, string> = {
	0: 'Нет',
	1: 'Лёгкая',
	2: 'Умеренная',
	3: 'Тяжёлая',
	4: 'Очень тяжёлая',
};
