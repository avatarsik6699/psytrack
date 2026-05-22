import React, { useState } from 'react';
import { Link } from 'react-router';

import { useLogDoseMutation, useMyMedications } from '@shared/api/medications';
import { useMyAssignedScales } from '@shared/api/scales';
import { date } from '@shared/lib/date';

type MedRow = {
	id: string;
	medication: { inn: string };
	dose_mg: string | null;
	unit: string | null;
	frequency: string | null;
};

type MedicationRowProps = {
	med: MedRow;
};

const MedicationRow: React.FC<MedicationRowProps> = props => {
	const logMutation = useLogDoseMutation(props.med.id);
	const [logging, setLogging] = useState(false);

	const log = (status: 'taken' | 'missed') => {
		if (logging) return;
		setLogging(true);
		logMutation.mutate({ status, occurred_at: date.nowIso() }, { onSettled: () => setLogging(false) });
	};

	return (
		<li className='bg-white border border-border rounded-lg p-4 flex justify-between items-center'>
			<div>
				<p className='text-sm font-medium'>{props.med.medication.inn}</p>
				{(props.med.dose_mg || props.med.frequency) && (
					<p className='text-xs text-muted-foreground mt-0.5'>
						{props.med.dose_mg && `${props.med.dose_mg}${props.med.unit ? ` ${props.med.unit}` : ''}`}
						{props.med.dose_mg && props.med.frequency && ' · '}
						{props.med.frequency}
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
};

const HomePage: React.FC = () => {
	const scalesQuery = useMyAssignedScales();
	const medsQuery = useMyMedications();
	const scales = scalesQuery.data ?? [];
	const meds = medsQuery.data ?? [];

	return (
		<main className='p-6 space-y-6'>
			<section>
				<header className='mb-3'>
					<h2 className='text-xl font-semibold'>My Medications</h2>
					<p className='text-sm text-muted-foreground mt-1'>Log your daily doses.</p>
				</header>
				{medsQuery.isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}
				{!medsQuery.isLoading && meds.length === 0 && (
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

			{scalesQuery.isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}

			{!scalesQuery.isLoading && scales.length === 0 && (
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
};

export default HomePage;
