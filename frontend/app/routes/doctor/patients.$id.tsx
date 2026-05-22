import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { usePatientMedications } from '@shared/api/medications';
import { usePatient, useArchivePatientMutation } from '@shared/api/patients';
import { useDeleteScaleMutation, usePatientScales } from '@shared/api/scales';
import { useDiagnoses } from '@shared/api/diagnoses';

import { AssignTestModal } from '@/components/doctor/AssignTestModal';
import { DiagnosisList } from '@/components/doctor/DiagnosisList';
import { DiagnosisTabSwitcher } from '@/components/doctor/DiagnosisTabSwitcher';
import { EventTimeline } from '@/components/doctor/EventTimeline';
import { MedicationAssignForm } from '@/components/doctor/MedicationAssignForm';
import { MedicationChart } from '@/components/doctor/MedicationChart';
import { PatientHeader } from '@/components/doctor/PatientHeader';
import { SEChart } from '@/components/doctor/SEChart';
import { SEMonitoringModal } from '@/components/doctor/SEMonitoringModal';
import { TherapyGoals } from '@/components/doctor/TherapyGoals';
import { ScoreChart } from '@/components/charts/ScoreChart';

export default function PatientDetailRoute() {
	const { id } = useParams<{ id: string }>();
	const { data: patient, isLoading } = usePatient(id!);
	const navigate = useNavigate();
	const [addingMed, setAddingMed] = useState(false);
	const [showAssignTest, setShowAssignTest] = useState(false);
	const [showSeMonitoring, setShowSeMonitoring] = useState(false);
	const [activeDiagId, setActiveDiagId] = useState<string | null>(null);
	const archiveMutation = useArchivePatientMutation(id!);
	const { data: meds = [] } = usePatientMedications(id!);
	const { data: assignedScales = [], isLoading: loadingScales } = usePatientScales(id!);
	const { data: diagnoses = [] } = useDiagnoses(id!);
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
			{/* PatientHeader — avatar, status, severity pills, adherence, meds */}
			<PatientHeader
				patient={patient as any}
				onEdit={() => {}}
				onArchive={handleArchive}
			/>

			{/* Diagnosis tab switcher */}
			{diagnoses.length > 0 && (
				<section className='bg-white rounded-lg border border-border p-4'>
					<h2 className='font-semibold text-sm mb-3'>Diagnoses</h2>
					<DiagnosisTabSwitcher
						diagnoses={diagnoses}
						activeId={activeDiagId ?? diagnoses[0]?.id ?? null}
						onChange={setActiveDiagId}
					/>
				</section>
			)}

			{/* Diagnoses detail */}
			<DiagnosisList patientId={id!} />

			{/* Score trends chart + assessment table */}
			<section className='bg-white rounded-lg border border-border p-4'>
				<ScoreChart patientId={id!} />
			</section>

			{/* Medications */}
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

			{/* Assigned scales */}
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

			{/* Side effects chart */}
			<section className='bg-white rounded-lg border border-border p-4'>
				<div className='flex justify-between items-center mb-3'>
					<h2 className='font-semibold text-sm'>Побочные эффекты</h2>
					<button
						className='text-xs text-primary hover:underline'
						onClick={() => setShowSeMonitoring(true)}
					>
						Правила мониторинга
					</button>
				</div>
				<SEChart patientId={id!} />
			</section>

			{/* Therapy Goals + right-sidebar panels */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
				<section className='lg:col-span-2 bg-white rounded-lg border border-border p-4'>
					<h2 className='font-semibold text-sm mb-3'>Event Timeline</h2>
					<EventTimeline patientId={id!} />
				</section>

				<aside className='space-y-4'>
					<section className='bg-white rounded-lg border border-border p-4'>
						<h2 className='font-semibold text-sm mb-3'>Therapy Goals</h2>
						<TherapyGoals patientId={id!} />
					</section>

					{/* Clinical summary: latest scores vs previous */}
					{((patient as any).latest_scores ?? []).length > 0 && (
						<section className='bg-white rounded-lg border border-border p-4'>
							<h2 className='font-semibold text-sm mb-2'>Clinical Summary</h2>
							{((patient as any).latest_scores as { scale_code: string; score: number; severity_label: string }[]).map(s => (
								<div key={s.scale_code} className='flex justify-between text-sm py-1'>
									<span className='text-muted-foreground'>{s.scale_code}</span>
									<span className='font-medium'>
										{s.score}{' '}
										<span className='text-xs text-muted-foreground'>({s.severity_label})</span>
									</span>
								</div>
							))}
						</section>
					)}
				</aside>
			</div>

			{showSeMonitoring && (
				<SEMonitoringModal patientId={id!} onClose={() => setShowSeMonitoring(false)} />
			)}
		</div>
	);
}
