import { useState } from 'react';
import { useNavigate } from 'react-router';

import { usePatients } from '@shared/api/patients';

import { AddPatientModal } from '@/components/doctor/AddPatientModal';
import { PatientCard } from '@/components/doctor/PatientCard';

export default function DoctorIndexRoute() {
	const { data: patients = [], isLoading } = usePatients();
	const [showAdd, setShowAdd] = useState(false);
	const navigate = useNavigate();

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Loading…</div>;
	}

	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-xl font-semibold'>Patients</h1>
				<button
					className='px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
					onClick={() => setShowAdd(true)}
				>
					+ Add Patient
				</button>
			</div>
			{patients.length === 0 ? (
				<p className='text-muted-foreground text-sm'>No patients yet.</p>
			) : (
				<div className='grid gap-3'>
					{patients.map(p => (
						<PatientCard key={p.id} patient={p} onClick={() => navigate(`/doctor/patients/${p.id}`)} />
					))}
				</div>
			)}
			{showAdd && <AddPatientModal onClose={() => setShowAdd(false)} />}
		</div>
	);
}
