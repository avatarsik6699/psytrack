import { CheckCircle2, ClipboardList } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { components } from '@shared/types/schema';

type PatientScaleOut = components['schemas']['PatientScaleOut'];

type Props = {
	scale: PatientScaleOut;
	isPending: boolean;
};

export const TestCard: React.FC<Props> = props => {
	const { t, i18n } = useTranslation('common');
	const isRu = i18n.language === 'ru';

	return (
		<div className='bg-card text-card-foreground border border-border rounded-lg p-4 flex items-center gap-4'>
			<div
				className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${props.isPending ? 'bg-amber-100' : 'bg-green-100 dark:bg-green-950/30'}`}
			>
				<ClipboardList
					size={18}
					className={props.isPending ? 'text-amber-600' : 'text-green-600 dark:text-green-400'}
				/>
			</div>
			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-2'>
					<span className='font-medium text-sm'>
						{isRu
							? props.scale.scale?.name_ru || props.scale.scale?.name
							: (props.scale.scale?.name ?? props.scale.scale_id)}
					</span>
					{props.isPending && (
						<span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
							{t('patientPortal.awaiting')}
						</span>
					)}
				</div>
				{props.scale.scale?.code && (
					<p className='text-xs text-muted-foreground mt-0.5'>
						{props.scale.scale.code} · {t('patientPortal.everyDays', { days: props.scale.frequency_days })}
					</p>
				)}
			</div>
			{props.isPending ? (
				<Link
					to={`/assessment/${props.scale.id}`}
					className='shrink-0 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity'
				>
					{t('patientPortal.start')}
				</Link>
			) : (
				<span className='shrink-0 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-1.5'>
					<CheckCircle2 size={13} />
					{t('patientPortal.completed')}
				</span>
			)}
		</div>
	);
};
