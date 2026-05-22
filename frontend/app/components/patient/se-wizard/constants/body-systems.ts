export const BODY_SYSTEMS = [
	{ key: '', label: 'Все' },
	{ key: 'Психические', label: 'Психические' },
	{ key: 'ЦНС', label: 'ЦНС' },
	{ key: 'Вегетативные', label: 'Вегетативные' },
	{ key: 'ЖКТ', label: 'ЖКТ' },
	{ key: 'Кожные', label: 'Кожные' },
	{ key: 'Другое', label: 'Другое' },
] as const;

export const SEVERITY_LABELS: Record<number, string> = {
	0: 'Нет',
	1: 'Лёгкая',
	2: 'Умеренная',
	3: 'Тяжёлая',
	4: 'Очень тяжёлая',
};
