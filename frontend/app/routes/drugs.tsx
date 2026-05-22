import { Pill } from 'lucide-react';

import { useMyMedications, useLogDoseMutation } from '@shared/api/medications';

import type { components } from '@shared/types/schema';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

const todayLabel = new Intl.DateTimeFormat('ru-RU', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
}).format(new Date());

function MedLogCard({ med }: { med: PatientMedicationOut }) {
	const logMutation = useLogDoseMutation(med.id);

	const handleLog = (status: 'taken' | 'missed') => {
		logMutation.mutate({ status, occurred_at: new Date().toISOString() });
	};

	return (
		<div className='bg-white border border-border rounded-lg p-4 flex items-center gap-4'>
			<div className='shrink-0 w-10 h-10 rounded-lg bg-docassist-primary-subtle flex items-center justify-center'>
				<Pill size={18} className='text-docassist-primary' />
			</div>
			<div className='flex-1 min-w-0'>
				<p className='font-medium text-sm'>{med.medication?.inn ?? '—'}</p>
				<p className='text-xs text-muted-foreground'>
					{med.dose_mg ? `${med.dose_mg} ${med.unit ?? 'мг'} · ` : ''}
					{med.frequency ?? ''} · с{' '}
					{med.started_at
						? new Date(med.started_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
						: '—'}
				</p>
			</div>
			<div className='shrink-0 flex gap-2'>
				<button
					disabled={logMutation.isPending}
					onClick={() => handleLog('taken')}
					className='px-3 py-1.5 text-xs border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40'
				>
					✓ Принял
				</button>
				<button
					disabled={logMutation.isPending}
					onClick={() => handleLog('missed')}
					className='px-3 py-1.5 text-xs border border-border text-muted-foreground rounded-md hover:bg-muted transition-colors disabled:opacity-40'
				>
					Пропустил
				</button>
			</div>
		</div>
	);
}

export function meta() {
	return [{ title: 'Препараты — PsychTrack' }];
}

export default function DrugsPage() {
	const { data: meds = [], isLoading } = useMyMedications();

	const activeMeds = (meds as PatientMedicationOut[]).filter(
		m => !m.ended_at || new Date(m.ended_at) >= new Date()
	);

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 space-y-4'>
			<div>
				<h1 className='text-lg font-semibold'>Препараты</h1>
				<p className='text-sm text-muted-foreground'>Отметьте приём на сегодня, {todayLabel}</p>
			</div>

			{activeMeds.length === 0 && (
				<p className='text-sm text-muted-foreground'>Нет назначенных препаратов.</p>
			)}

			<div className='space-y-3'>
				{activeMeds.map(med => (
					<MedLogCard key={med.id} med={med} />
				))}
			</div>
		</div>
	);
}
