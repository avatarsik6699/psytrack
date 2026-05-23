import { Pill } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useLogDoseMutation } from '@shared/api/medications';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

type Props = {
	med: PatientMedicationOut;
};

export const MedLogCard: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const logMutation = useLogDoseMutation(props.med.id);

	const handleLog = (status: 'taken' | 'missed') => {
		logMutation.mutate({ status, occurred_at: date.nowIso() });
	};

	return (
		<div className='bg-card text-card-foreground border border-border rounded-lg p-4 flex items-center gap-4'>
			<div className='shrink-0 w-10 h-10 rounded-lg bg-docassist-primary-subtle flex items-center justify-center'>
				<Pill size={18} className='text-docassist-primary' />
			</div>
			<div className='flex-1 min-w-0'>
				<p className='font-medium text-sm'>{props.med.medication?.inn ?? '—'}</p>
				<p className='text-xs text-muted-foreground'>
					{props.med.dose_mg ? `${props.med.dose_mg} ${props.med.unit ?? 'мг'} · ` : ''}
					{props.med.frequency ?? ''} ·{' '}
					{t('patientPortal.since', { date: date.formatMonthShortRu(props.med.started_at ?? null) })}
				</p>
			</div>
			<div className='shrink-0 flex gap-2'>
				<button
					disabled={logMutation.isPending}
					onClick={() => handleLog('taken')}
					className='px-3 py-1.5 text-xs border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40'
				>
					✓ {t('patientPortal.taken')}
				</button>
				<button
					disabled={logMutation.isPending}
					onClick={() => handleLog('missed')}
					className='px-3 py-1.5 text-xs border border-border text-muted-foreground rounded-md hover:bg-muted transition-colors disabled:opacity-40'
				>
					{t('patientPortal.missed')}
				</button>
			</div>
		</div>
	);
};
