import React from 'react';
import { useTranslation } from 'react-i18next';

import { useUpdateSideEffectMutation } from '@shared/api/side-effects';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type PatientSideEffectOut = components['schemas']['PatientSideEffectOut'];

type Props = {
	se: PatientSideEffectOut;
};

export const SECard: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const updateMutation = useUpdateSideEffectMutation(props.se.id);

	const handleResolve = () => {
		updateMutation.mutate({ resolved: true });
	};

	const severityColor =
		(props.se.severity ?? 0) >= 3 ? 'bg-red-500' : (props.se.severity ?? 0) >= 2 ? 'bg-amber-500' : 'bg-yellow-400';

	return (
		<div className='bg-card text-card-foreground border border-border rounded-lg flex overflow-hidden'>
			<div className={`w-1 shrink-0 ${severityColor}`} />
			<div className='flex-1 p-4 flex items-center gap-3'>
				<div className='flex-1 min-w-0'>
					<div className='flex items-center gap-2 flex-wrap'>
						<span className='font-medium text-sm'>{props.se.se.name_ru}</span>
						{props.se.severity !== null && (
							<span className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'>
								UKU {props.se.severity}
							</span>
						)}
						{props.se.severity !== null && (
							<span className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700'>
								{t(`patientPortal.severity.${props.se.severity}`)}
							</span>
						)}
					</div>
					<p className='text-xs text-muted-foreground mt-0.5'>
						{props.se.se.body_system ?? '—'} ·{' '}
						{t('patientPortal.since', { date: date.formatMonthShortRu(props.se.started_at ?? null) })}
					</p>
				</div>
				{!props.se.resolved && (
					<button
						disabled={updateMutation.isPending}
						onClick={handleResolve}
						className='shrink-0 px-3 py-1.5 text-xs border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-40'
					>
						✓ {t('patientPortal.resolved')}
					</button>
				)}
			</div>
		</div>
	);
};
