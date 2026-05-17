import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { usePatientMedications } from '@shared/api/medications';
import { useArchivePatientMutation, usePatient } from '@shared/api/patients';
import { useDeleteScaleMutation, usePatientScales } from '@shared/api/scales';

import { AssignTestModal } from '@/components/doctor/AssignTestModal';
import { DiagnosisList } from '@/components/doctor/DiagnosisList';
import { MedicationAssignForm } from '@/components/doctor/MedicationAssignForm';
import { MedicationChart } from '@/components/doctor/MedicationChart';
import { PatientHeader } from '@/components/doctor/PatientHeader';

export default function PatientDetailRoute() {
	const { id } = useParams<{ id: string }>();
	const { data: patient, isLoading } = usePatient(id!);
	const navigate = useNavigate();
	const [addingMed, setAddingMed] = useState(false);
	const [showAssignTest, setShowAssignTest] = useState(false);
	const archiveMutation = useArchivePatientMutation(id!);
	const { data: meds = [] } = usePatientMedications(id!);
	const { data: assignedScales = [], isLoading: loadingScales } = usePatientScales(id!);
	const deleteMutation = useDeleteScaleMutation(id!);

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

	const handleDeleteScale = (patientScaleId: string, scaleName: string) => {
		if (window.confirm(`Remove scale "${scaleName}"? This cannot be undone if no assessments have been completed.`)) {
			deleteMutation.mutate(patientScaleId, {
				onError: (err: unknown) => {
					const msg =
						err && typeof err === 'object' && 'detail' in err
							? String((err as { detail: string }).detail)
							: 'Failed to remove scale.';
					alert(msg);
				},
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
				<MedicationChart patientId={id!} />
			</section>

			<section className='bg-white rounded-lg border border-border p-4'>
				<div className='flex justify-between items-center mb-3'>
					<h2 className='font-semibold text-sm'>Assigned Scales</h2>
					{!showAssignTest && (
						<button className='text-xs text-primary hover:underline' onClick={() => setShowAssignTest(true)}>
							+ Assign Test
						</button>
					)}
				</div>

				{loadingScales && <p className='text-xs text-muted-foreground'>Loading…</p>}

				{!loadingScales && assignedScales.length === 0 && !showAssignTest && (
					<p className='text-xs text-muted-foreground'>No scales assigned.</p>
				)}

				{assignedScales.map(ps => (
					<div key={ps.id} className='py-2 border-t border-border first:border-0 flex justify-between items-center'>
						<div>
							<span className='text-sm font-medium'>{ps.scale?.name ?? ps.scale_id}</span>
							<span className='text-xs text-muted-foreground ml-2'>every {ps.frequency_days} days</span>
						</div>
						<button
							className='text-xs text-red-500 hover:underline disabled:opacity-40'
							disabled={deleteMutation.isPending}
							onClick={() => handleDeleteScale(ps.id, ps.scale?.name ?? 'this scale')}
						>
							Remove
						</button>
					</div>
				))}

				{showAssignTest && (
					<AssignTestModal
						patientId={id!}
						onSuccess={() => setShowAssignTest(false)}
						onCancel={() => setShowAssignTest(false)}
					/>
				)}
			</section>
		</div>
	);
}
