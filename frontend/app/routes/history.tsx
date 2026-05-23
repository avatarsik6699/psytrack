import { useTranslation } from 'react-i18next';

import { useTestHistory } from '@shared/api/scales';
import { date } from '@shared/lib/date';

export default function HistoryPage() {
	const { i18n } = useTranslation();
	const isRu = i18n.language === 'ru';
	const { data, isLoading } = useTestHistory();
	const items = data?.items ?? [];

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка истории...</div>;
	}

	return (
		<div className='mx-auto max-w-4xl space-y-4 p-4 md:p-6'>
			<div>
				<h1 className='text-xl font-semibold'>История тестов</h1>
				<p className='text-sm text-muted-foreground'>Завершенные шкалы и контрольные точки.</p>
			</div>
			{items.length === 0 ? (
				<div className='rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground'>
					Завершенных тестов пока нет.
				</div>
			) : (
				<ul className='space-y-2'>
					{items.map(item => (
						<li key={item.id} className='rounded-xl border border-border bg-card p-4 text-card-foreground'>
							<div className='flex items-start justify-between gap-3'>
								<span className='text-sm font-medium'>
									{isRu
										? item.scale?.name_ru || item.scale?.name || item.scale_id
										: (item.scale?.name ?? item.scale_id)}
								</span>
								<span className='text-xs text-muted-foreground'>{date.formatMonthShortRu(item.completed_at)}</span>
							</div>
							<p className='text-xs text-muted-foreground mt-0.5'>
								Балл: <span className='font-medium text-foreground'>{item.score}</span>
								{item.baseline && ' · базовое измерение'}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
