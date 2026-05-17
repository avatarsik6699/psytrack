import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { usePatientMedications } from '@shared/api/medications';
import { useArchivePatientMutation, usePatient } from '@shared/api/patients';

import { DiagnosisList } from '@/components/doctor/DiagnosisList';
import { MedicationAssignForm } from '@/components/doctor/MedicationAssignForm';
import { PatientHeader } from '@/components/doctor/PatientHeader';

export default function PatientDetailRoute() {
	const { id } = useParams<{ id: string }>();
	const { data: patient, isLoading } = usePatient(id!);
	const navigate = useNavigate();
	const [addingMed, setAddingMed] = useState(false);
	const archiveMutation = useArchivePatientMutation(id!);
	const { data: meds = [] } = usePatientMedications(id!);

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Loading…</div>;
	}
	if (!patient) {
		return <div className='p-6 text-sm'>Patient not found.</div>;
	}

	const handleArchive = () => {
		if (window.confirm(`Archive ${patient.full_name}?`)) {
			archiveMutation.mutate(undefined, {
				onSuccess: () => navigate('/doctor'),
			});
		}
	};

	return (
		<div className='p-6 space-y-4'>
			<PatientHeader
				patient={patient}
				onEdit={() => {
					/* edit handled inline in future */
				}}
				onArchive={handleArchive}
			/>

			<DiagnosisList patientId={id!} />

			<section className='bg-white rounded-lg border border-border p-4'>
				<div className='flex justify-between items-center mb-3'>
					<h2 className='font-semibold text-sm'>Medications</h2>
					<button className='text-xs text-primary hover:underline' onClick={() => setAddingMed(v => !v)}>
						{addingMed ? 'Cancel' : '+ Assign'}
					</button>
				</div>
				{meds.length === 0 && !addingMed && <p className='text-xs text-muted-foreground'>No medications assigned.</p>}
				{meds.map(m => (
					<div key={m.id} className='py-2 border-t border-border first:border-0 text-sm'>
						<span className='font-medium'>{m.medication.inn}</span>
						{m.dose_mg && (
							<span className='text-gray-500 ml-2'>
								{String(m.dose_mg)} {m.unit}
							</span>
						)}
						{m.frequency && <span className='text-gray-500 ml-2'>· {m.frequency}</span>}
					</div>
				))}
				{addingMed && (
					<MedicationAssignForm
						patientId={id!}
						onSuccess={() => setAddingMed(false)}
						onCancel={() => setAddingMed(false)}
					/>
				)}
			</section>
		</div>
	);
}
