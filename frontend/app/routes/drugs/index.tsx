import React from 'react';
import { useTranslation } from 'react-i18next';

import { useMyMedications } from '@shared/api/medications';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { Skeleton } from '@/components/ui/skeleton';

import { MedLogCard } from './components/med-log-card';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

export function meta() {
	return [{ title: 'Препараты — PsychTrack' }];
}

const DrugsPage: React.FC = () => {
	const { t } = useTranslation('common');
	const medicationsQuery = useMyMedications();

	const activeMeds = ((medicationsQuery.data ?? []) as PatientMedicationOut[]).filter(m =>
		date.isDateOnOrAfterToday(m.ended_at)
	);

	if (medicationsQuery.isLoading) {
		return (
			<div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-3'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className='h-16 w-full' />
				))}
			</div>
		);
	}

	return (
		<div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-4'>
			<div>
				<h1 className='text-lg font-semibold'>{t('nav.drugs')}</h1>
				<p className='text-sm text-muted-foreground'>
					{t('patientPortal.drugsHint')}, {date.todayLabelRu()}
				</p>
			</div>

			{activeMeds.length === 0 && <p className='text-sm text-muted-foreground'>{t('patientPortal.noDrugs')}</p>}

			<div className='space-y-3'>
				{activeMeds.map(med => (
					<MedLogCard key={med.id} med={med} />
				))}
			</div>
		</div>
	);
};

export default DrugsPage;
