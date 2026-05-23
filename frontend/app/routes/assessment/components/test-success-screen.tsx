import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { components } from '@shared/types/schema';

import { SEVERITY_THRESHOLDS } from '../constants/severity';

type TestCompletionOut = components['schemas']['TestCompletionOut'];

type Props = {
	result: TestCompletionOut;
};

function severityLabel(code: string, score: number): string {
	const table = SEVERITY_THRESHOLDS[code];
	if (!table) {
		return '';
	}

	for (const [threshold, label] of table) {
		if (score <= threshold) {
			return label;
		}
	}

	return 'Тяжёлая';
}

export const TestSuccessScreen: React.FC<Props> = props => {
	const { i18n } = useTranslation();
	const isRu = i18n.language === 'ru';
	const scaleName = isRu
		? props.result.scale?.name_ru || props.result.scale?.name || 'Тест'
		: (props.result.scale?.name ?? 'Тест');
	const scaleCode = props.result.scale?.code ?? '';
	const label = scaleCode ? severityLabel(scaleCode, props.result.score) : '';

	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4'>
			<div className='w-20 h-20 rounded-full bg-green-500 flex items-center justify-center'>
				<svg viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth={2.5} className='w-10 h-10'>
					<polyline points='20 6 9 17 4 12' />
				</svg>
			</div>
			<h1 className='text-xl font-semibold'>Тест пройден!</h1>
			<p className='text-muted-foreground text-sm'>Ответы переданы врачу</p>
			{label && (
				<p className='text-sm text-muted-foreground'>
					Результат {scaleName}: {props.result.score} — {label}
				</p>
			)}
			<Link
				to='/tests'
				className='mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity'
			>
				К списку тестов
			</Link>
		</div>
	);
};
