import { ChevronLeft } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';

import { useDiagnoses } from '@shared/api/diagnoses';
import { usePatientMedications } from '@shared/api/medications';
import { usePatient, useArchivePatientMutation } from '@shared/api/patients';
import { useDeleteScaleMutation, usePatientScales } from '@shared/api/scales';
import { useRouter } from '@shared/hooks/use-router';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { ScoreChart } from '@/components/charts/score-chart';
import { AssignTestModal } from '@/components/doctor/assign-test-modal';
import { DiagnosisList } from '@/components/doctor/diagnosis-list';
import { DiagnosisTabSwitcher } from '@/components/doctor/diagnosis-tab-switcher';
import { EventTimeline } from '@/components/doctor/event-timeline';
import { MedicationAssignForm } from '@/components/doctor/medication-assign-form';
import { MedicationChart } from '@/components/doctor/medication-chart';
import { PatientHeader } from '@/components/doctor/patient-header';
import { SEChart } from '@/components/doctor/se-chart';
import { SEMonitoringModal } from '@/components/doctor/se-monitoring-modal';
import { TherapyGoals } from '@/components/doctor/therapy-goals';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

const MED_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-400', 'bg-pink-500'];

type MedRowProps = {
	med: PatientMedicationOut;
	colorClass: string;
};

const MedRow: React.FC<MedRowProps> = props => {
	const isActive = !props.med.ended_at;
	return (
		<div className='flex items-center gap-3 py-2 border-t border-border first:border-0'>
			<span className={`w-2 h-2 rounded-full shrink-0 ${props.colorClass}`} />
			<div className='flex-1 min-w-0'>
				<span className='text-sm font-medium'>
					{props.med.medication.inn}
					{props.med.dose_mg ? ` ${props.med.dose_mg}${props.med.unit ?? 'мг'}` : ''}
				</span>
				{(props.med.frequency || props.med.started_at) && (
					<p className='text-xs text-muted-foreground'>
						{props.med.frequency ?? ''}
						{props.med.started_at ? ` · с ${date.formatMonthShortRu(props.med.started_at)}` : ''}
					</p>
				)}
			</div>
			{isActive && (
				<span className='text-[11px] px-1.5 py-0.5 rounded font-medium text-status-ok-fg bg-status-ok-bg'>Активен</span>
			)}
		</div>
	);
};

const PatientDetailRoute: React.FC = () => {
	const router = useRouter();
	const id = router.params.id as string;

	const patientQuery = usePatient(id);
	const [addingMed, setAddingMed] = useState(false);
	const [showAssignTest, setShowAssignTest] = useState(false);
	const [showSeMonitoring, setShowSeMonitoring] = useState(false);
	const [activeDiagId, setActiveDiagId] = useState<string | null>(null);
	const archiveMutation = useArchivePatientMutation(id);
	const medsQuery = usePatientMedications(id);
	const meds = medsQuery.data ?? [];
	const assignedScalesQuery = usePatientScales(id);
	const assignedScales = assignedScalesQuery.data ?? [];
	const diagnosesQuery = useDiagnoses(id);
	const diagnoses = diagnosesQuery.data ?? [];
	const deleteMutation = useDeleteScaleMutation(id);

	if (patientQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}
	if (!patientQuery.data) {
		return <div className='p-6 text-sm'>Пациент не найден.</div>;
	}

	const patient = patientQuery.data;
	const nameShort = patient.full_name.split(' ').slice(0, 2).join(' ');

	const handleArchive = () => {
		if (window.confirm(`Архивировать ${patient.full_name}?`)) {
			archiveMutation.mutate(undefined, {
				onSuccess: () => router.navigate('/doctor'),
			});
		}
	};

	const handleDeleteScale = (patientScaleId: string, scaleName: string) => {
		if (window.confirm(`Убрать шкалу "${scaleName}"?`)) {
			deleteMutation.mutate(patientScaleId, {
				onError: (err: unknown) => {
					const msg =
						err && typeof err === 'object' && 'detail' in err
							? String((err as { detail: string }).detail)
							: 'Не удалось удалить шкалу.';
					alert(msg);
				},
			});
		}
	};

	const latestScore = (
		patient as never as {
			latest_scores?: { scale_code: string; score: number; severity_label: string }[];
		}
	).latest_scores?.[0];

	return (
		<div className='p-6 max-w-5xl'>
			<div className='flex items-center gap-1.5 text-sm text-muted-foreground mb-4'>
				<Link to='/doctor' className='hover:text-foreground flex items-center gap-1'>
					<ChevronLeft size={14} />
					Пациенты
				</Link>
				<span>/</span>
				<span className='text-foreground font-medium'>{nameShort}</span>
			</div>

			<div className='bg-white rounded-xl border border-border p-5 mb-4'>
				<PatientHeader patient={patient as never} diagnoses={diagnoses} onEdit={() => {}} onArchive={handleArchive} />
			</div>

			<Tabs defaultValue='overview' className='space-y-4'>
				<div className='bg-white rounded-xl border border-border px-4'>
					<TabsList variant='line' className='w-full justify-start h-auto py-0 rounded-none'>
						<TabsTrigger value='overview' className='px-4 py-3 text-sm'>
							Обзор
						</TabsTrigger>
						<TabsTrigger value='medications' className='px-4 py-3 text-sm'>
							Препараты
						</TabsTrigger>
						<TabsTrigger value='dynamics' className='px-4 py-3 text-sm'>
							Динамика
						</TabsTrigger>
						<TabsTrigger value='se' className='px-4 py-3 text-sm'>
							Побочные эффекты
						</TabsTrigger>
						<TabsTrigger value='events' className='px-4 py-3 text-sm'>
							Лента событий
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value='overview' className='space-y-4'>
					<div className='bg-white rounded-xl border border-border p-5'>
						<div className='grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-border'>
							<div className='px-2 first:pl-0'>
								<p className='text-xs text-muted-foreground mb-1'>Последний визит</p>
								<p className='text-sm font-semibold'>—</p>
							</div>
							<div className='px-4'>
								<p className='text-xs text-muted-foreground mb-1'>Последний тест</p>
								<p className='text-sm font-semibold'>
									{latestScore ? `${latestScore.scale_code} · Балл ${latestScore.score}` : '—'}
								</p>
							</div>
							<div className='px-4'>
								<p className='text-xs text-muted-foreground mb-1'>Препаратов</p>
								<p className='text-sm font-semibold'>{meds.length || '—'}</p>
							</div>
							<div className='px-4'>
								<p className='text-xs text-muted-foreground mb-1'>Активных ПЭ</p>
								<p className='text-sm font-semibold'>—</p>
							</div>
						</div>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
						<div className='bg-white rounded-xl border border-border p-5'>
							<h2 className='font-semibold text-sm mb-3'>Препараты</h2>
							{meds.length === 0 ? (
								<p className='text-xs text-muted-foreground'>Препараты не назначены.</p>
							) : (
								meds.map((m, i) => <MedRow key={m.id} med={m} colorClass={MED_COLORS[i % MED_COLORS.length]} />)
							)}
						</div>

						<div className='bg-white rounded-xl border border-border p-5'>
							<h2 className='font-semibold text-sm mb-3'>Цели терапии</h2>
							<TherapyGoals patientId={id} />
						</div>
					</div>

					<div className='bg-white rounded-xl border border-border p-5'>
						<h2 className='font-semibold text-sm mb-3'>Диагнозы</h2>
						<DiagnosisList patientId={id} />
					</div>
				</TabsContent>

				<TabsContent value='medications' className='space-y-4'>
					<div className='bg-white rounded-xl border border-border p-5'>
						<h2 className='font-semibold text-sm mb-1'>График препаратов</h2>
						<p className='text-xs text-muted-foreground mb-3'>Хронология доз</p>
						<MedicationChart patientId={id} />
					</div>

					<div className='bg-white rounded-xl border border-border p-5'>
						<div className='flex justify-between items-center mb-3'>
							<h2 className='font-semibold text-sm'>Текущие препараты</h2>
							<button
								className='text-xs flex items-center gap-1 border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors'
								onClick={() => setAddingMed(v => !v)}
							>
								{addingMed ? 'Отмена' : '+ Добавить'}
							</button>
						</div>
						{meds.length === 0 && !addingMed && (
							<p className='text-xs text-muted-foreground'>Препараты не назначены.</p>
						)}
						{meds.length > 0 && (
							<table className='w-full text-xs'>
								<thead>
									<tr className='text-muted-foreground border-b border-border'>
										<th className='text-left font-medium pb-2'>Препарат</th>
										<th className='text-left font-medium pb-2'>Доза</th>
										<th className='text-left font-medium pb-2'>Кратность</th>
										<th className='text-left font-medium pb-2'>Начало</th>
										<th className='text-left font-medium pb-2'>Статус</th>
									</tr>
								</thead>
								<tbody>
									{meds.map((m, i) => (
										<tr key={m.id} className='border-t border-border first:border-0'>
											<td className='py-2.5'>
												<span className='flex items-center gap-2'>
													<span className={`w-2 h-2 rounded-full shrink-0 ${MED_COLORS[i % MED_COLORS.length]}`} />
													{m.medication.inn}
												</span>
											</td>
											<td className='py-2.5'>{m.dose_mg ? `${m.dose_mg} ${m.unit ?? 'мг'}` : '—'}</td>
											<td className='py-2.5'>{m.frequency ?? '—'}</td>
											<td className='py-2.5'>{date.formatMonthShortRu(m.started_at)}</td>
											<td className='py-2.5'>
												{!m.ended_at ? (
													<span className='text-[11px] px-1.5 py-0.5 rounded font-medium text-status-ok-fg bg-status-ok-bg'>
														Активен
													</span>
												) : (
													<span className='text-[11px] px-1.5 py-0.5 rounded font-medium text-muted-foreground bg-muted'>
														Завершён
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
						{addingMed && (
							<div className='mt-3 pt-3 border-t border-border'>
								<MedicationAssignForm
									patientId={id}
									onSuccess={() => setAddingMed(false)}
									onCancel={() => setAddingMed(false)}
								/>
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value='dynamics' className='space-y-4'>
					{diagnoses.length > 0 && (
						<div className='bg-white rounded-xl border border-border p-5'>
							<h2 className='font-semibold text-sm mb-3'>Диагноз</h2>
							<DiagnosisTabSwitcher
								diagnoses={diagnoses}
								activeId={activeDiagId ?? diagnoses[0]?.id ?? null}
								onChange={setActiveDiagId}
							/>
						</div>
					)}

					<div className='bg-white rounded-xl border border-border p-5'>
						<ScoreChart patientId={id} />
					</div>

					<div className='bg-white rounded-xl border border-border p-5'>
						<div className='flex justify-between items-center mb-3'>
							<h2 className='font-semibold text-sm'>Назначенные шкалы</h2>
							{!showAssignTest && (
								<button
									className='text-xs flex items-center gap-1 border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors'
									onClick={() => setShowAssignTest(true)}
								>
									+ Назначить тест
								</button>
							)}
						</div>
						{assignedScalesQuery.isLoading && <p className='text-xs text-muted-foreground'>Загрузка…</p>}
						{!assignedScalesQuery.isLoading && assignedScales.length === 0 && !showAssignTest && (
							<p className='text-xs text-muted-foreground'>Шкалы не назначены.</p>
						)}
						{assignedScales.map(ps => (
							<div
								key={ps.id}
								className='py-2.5 border-t border-border first:border-0 flex justify-between items-center'
							>
								<div>
									<span className='text-sm font-medium'>{ps.scale?.name ?? ps.scale_id}</span>
									<span className='text-xs text-muted-foreground ml-2'>каждые {ps.frequency_days} дн.</span>
								</div>
								<button
									className='text-xs text-red-500 hover:underline disabled:opacity-40'
									disabled={deleteMutation.isPending}
									onClick={() => handleDeleteScale(ps.id, ps.scale?.name ?? 'эту шкалу')}
								>
									Удалить
								</button>
							</div>
						))}
						{showAssignTest && (
							<div className='mt-3 pt-3 border-t border-border'>
								<AssignTestModal
									patientId={id}
									onSuccess={() => setShowAssignTest(false)}
									onCancel={() => setShowAssignTest(false)}
								/>
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value='se' className='space-y-4'>
					<div className='bg-white rounded-xl border border-border p-5'>
						<div className='flex justify-between items-center mb-1'>
							<div>
								<h2 className='font-semibold text-sm'>График тяжести ПЭ</h2>
								<p className='text-xs text-muted-foreground'>По шкале UKU (0–4)</p>
							</div>
							<button
								className='flex items-center gap-1.5 text-xs border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors'
								onClick={() => setShowSeMonitoring(true)}
							>
								Настроить
							</button>
						</div>
						<SEChart patientId={id} />
					</div>
				</TabsContent>

				<TabsContent value='events'>
					<div className='bg-white rounded-xl border border-border p-5'>
						<h2 className='font-semibold text-sm mb-3'>Лента событий</h2>
						<EventTimeline patientId={id} />
					</div>
				</TabsContent>
			</Tabs>

			{showSeMonitoring && <SEMonitoringModal patientId={id} onClose={() => setShowSeMonitoring(false)} />}
		</div>
	);
};

export default PatientDetailRoute;
