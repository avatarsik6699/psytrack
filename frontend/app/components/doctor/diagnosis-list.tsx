import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDiagnoses } from '@shared/api/diagnoses';

import { DiagnosisForm } from '@/components/doctor/diagnosis-form';
import { Button } from '@/components/ui/button';

type Props = {
	patientId: string;
};

export const DiagnosisList: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const diagnosesQuery = useDiagnoses(props.patientId);
	const diagnoses = diagnosesQuery.data ?? [];
	const [adding, setAdding] = useState(false);

	return (
		<section className='bg-card text-card-foreground rounded-lg border border-border p-4'>
			<div className='flex justify-between items-center mb-3'>
				<h2 className='font-semibold text-sm'>{t('diagnosis.title')}</h2>
				<Button variant='link' size='sm' className='h-auto px-0 text-xs' onClick={() => setAdding(v => !v)}>
					{adding ? t('diagnosis.cancel') : t('diagnosis.add')}
				</Button>
			</div>
			{diagnoses.length === 0 && !adding && (
				<p className='text-xs text-muted-foreground'>{t('diagnosis.noDiagnoses')}</p>
			)}
			{diagnoses.map(d => (
				<div key={d.id} className='flex items-center justify-between py-2 border-t border-border first:border-0'>
					<div>
						<span className='font-mono text-xs text-muted-foreground mr-2'>{d.icd_code}</span>
						<span className='text-sm'>{d.name}</span>
						{d.is_primary && (
							<span className='ml-2 text-xs text-docassist-primary font-medium'>{t('diagnosis.primary')}</span>
						)}
					</div>
					{d.date_diagnosed && <span className='text-xs text-muted-foreground ml-4'>{d.date_diagnosed}</span>}
				</div>
			))}
			{adding && (
				<DiagnosisForm
					patientId={props.patientId}
					onSuccess={() => setAdding(false)}
					onCancel={() => setAdding(false)}
				/>
			)}
		</section>
	);
};
