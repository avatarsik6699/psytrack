import React from 'react';

import { useMyAssignedScales } from '@shared/api/scales';
import { usePatientTasks } from '@shared/api/tasks';
import type { components } from '@shared/types/schema';

import { TestCard } from './components/test-card';

type PatientScaleOut = components['schemas']['PatientScaleOut'];

export function meta() {
	return [{ title: 'Тесты — PsychTrack' }];
}

const TestsPage: React.FC = () => {
	const scalesQuery = useMyAssignedScales();
	const tasksQuery = usePatientTasks();

	const pendingScaleIds = new Set(
		(tasksQuery.data ?? [])
			.filter(t => t.task_type === 'test' && t.status === 'pending' && t.reference_id)
			.map(t => t.reference_id as string)
	);

	if (scalesQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	const scales = (scalesQuery.data ?? []) as PatientScaleOut[];

	return (
		<div className='p-6 space-y-4'>
			<div>
				<h1 className='text-lg font-semibold'>Тесты</h1>
				<p className='text-sm text-muted-foreground'>Опросники, назначенные врачом</p>
			</div>

			{scales.length === 0 && <p className='text-sm text-muted-foreground'>Нет назначенных тестов.</p>}

			<div className='space-y-3'>
				{scales.map(ps => (
					<TestCard key={ps.id} scale={ps} isPending={pendingScaleIds.has(ps.id)} />
				))}
			</div>
		</div>
	);
};

export default TestsPage;
