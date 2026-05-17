import { useState } from 'react';
import { Link } from 'react-router';

import { useLogDoseMutation, useMyMedications } from '@shared/api/medications';
import { useMyAssignedScales } from '@shared/api/scales';

interface MedRow {
	id: string;
	medication: { inn: string };
	dose_mg: string | null;
	unit: string | null;
	frequency: string | null;
}

function MedicationRow({ med }: { med: MedRow }) {
	const logMutation = useLogDoseMutation(med.id);
	const [logging, setLogging] = useState(false);

	const log = (status: 'taken' | 'missed') => {
		if (logging) return;
		setLogging(true);
		logMutation.mutate(
			{ status, occurred_at: new Date().toISOString() },
			{ onSettled: () => setLogging(false) },
		);
	};

	return (
		<li className='bg-white border border-border rounded-lg p-4 flex justify-between items-center'>
			<div>
				<p className='text-sm font-medium'>{med.medication.inn}</p>
				{(med.dose_mg || med.frequency) && (
					<p className='text-xs text-muted-foreground mt-0.5'>
						{med.dose_mg && `${med.dose_mg}${med.unit ? ` ${med.unit}` : ''}`}
						{med.dose_mg && med.frequency && ' · '}
						{med.frequency}
					</p>
				)}
			</div>
			<div className='flex gap-2'>
				<button
					onClick={() => log('taken')}
					disabled={logging}
					className='text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-40'
				>
					Taken
				</button>
				<button
					onClick={() => log('missed')}
					disabled={logging}
					className='text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-40'
				>
					Missed
				</button>
			</div>
		</li>
	);
}

export default function HomePage() {
	const { data: scales = [], isLoading } = useMyAssignedScales();
	const { data: meds = [], isLoading: loadingMeds } = useMyMedications();

	return (
		<main className='p-6 space-y-6'>
			<section>
				<header className='mb-3'>
					<h2 className='text-xl font-semibold'>My Medications</h2>
					<p className='text-sm text-muted-foreground mt-1'>Log your daily doses.</p>
				</header>
				{loadingMeds && <p className='text-sm text-muted-foreground'>Loading…</p>}
				{!loadingMeds && meds.length === 0 && (
					<p className='text-sm text-muted-foreground'>No active medications.</p>
				)}
				{meds.length > 0 && (
					<ul className='space-y-3'>
						{(meds as MedRow[]).map(m => (
							<MedicationRow key={m.id} med={m} />
						))}
					</ul>
				)}
			</section>

			<header>
				<h1 className='text-2xl font-semibold'>My Assessments</h1>
				<p className='text-sm text-muted-foreground mt-1'>Complete the tests assigned by your doctor.</p>
			</header>

			{isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}

			{!isLoading && scales.length === 0 && (
				<p className='text-sm text-muted-foreground'>No assessments assigned yet.</p>
			)}

			{scales.length > 0 && (
				<ul className='space-y-3'>
					{scales.map(ps => (
						<li key={ps.id} className='bg-white border border-border rounded-lg p-4 flex justify-between items-center'>
							<div>
								<p className='text-sm font-medium'>{ps.scale?.name ?? 'Assessment'}</p>
								<p className='text-xs text-muted-foreground mt-0.5'>Every {ps.frequency_days} days</p>
							</div>
							<Link
								to={`/assessment/${ps.id}`}
								className='text-xs bg-[#5B5BD6] text-white px-3 py-1.5 rounded hover:opacity-90'
							>
								Start
							</Link>
						</li>
					))}
				</ul>
			)}

			<nav className='flex gap-4 pt-2'>
				<Link to='/history' className='text-sm text-primary hover:underline'>
					View history →
				</Link>
			</nav>
		</main>
	);
}
