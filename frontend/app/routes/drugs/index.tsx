import React from 'react';

import { useMyMedications } from '@shared/api/medications';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { MedLogCard } from './components/med-log-card';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

export function meta() {
	return [{ title: 'Препараты — PsychTrack' }];
}

const DrugsPage: React.FC = () => {
	const medicationsQuery = useMyMedications();

	const activeMeds = ((medicationsQuery.data ?? []) as PatientMedicationOut[]).filter(m =>
		date.isDateOnOrAfterToday(m.ended_at)
	);

	if (medicationsQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 space-y-4'>
			<div>
				<h1 className='text-lg font-semibold'>Препараты</h1>
				<p className='text-sm text-muted-foreground'>Отметьте приём на сегодня, {date.todayLabelRu()}</p>
			</div>

			{activeMeds.length === 0 && <p className='text-sm text-muted-foreground'>Нет назначенных препаратов.</p>}

			<div className='space-y-3'>
				{activeMeds.map(med => (
					<MedLogCard key={med.id} med={med} />
				))}
			</div>
		</div>
	);
};

export default DrugsPage;
