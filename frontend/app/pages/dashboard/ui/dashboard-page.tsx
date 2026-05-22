import { Activity, AlertTriangle, ClipboardList, Pill } from 'lucide-react';
import { Link } from 'react-router';

import { usePatientMe } from '@shared/api/patient-me';
import { usePatientTasks } from '@shared/api/tasks';
import { useMyMedications } from '@shared/api/medications';
import { useMySideEffects } from '@shared/api/side-effects';

import type { components } from '@shared/types/schema';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];
type PatientSideEffectOut = components['schemas']['PatientSideEffectOut'];

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function formatDateRu(d: Date) {
	return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function StatCard({
	icon,
	iconBg,
	count,
	countLabel,
	title,
	subtitle,
	badge,
	to,
}: {
	icon: React.ReactNode;
	iconBg: string;
	count: number | string;
	countLabel: string;
	title: string;
	subtitle: string;
	badge?: string;
	to: string;
}) {
	return (
		<Link
			to={to}
			className='relative flex flex-col gap-2 p-4 rounded-xl border border-border bg-white hover:shadow-md transition-shadow'
		>
			{badge && (
				<span className='absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white'>
					{badge}
				</span>
			)}
			<div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
				{icon}
			</div>
			<div>
				<p className='text-2xl font-bold leading-none'>{count}</p>
				<p className='text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5'>{countLabel}</p>
			</div>
			<p className='text-sm font-medium'>{title}</p>
			<p className='text-xs text-muted-foreground'>{subtitle}</p>
		</Link>
	);
}

export function DashboardPage() {
	const { data: patientMe } = usePatientMe();
	const { data: tasks = [] } = usePatientTasks();
	const { data: meds = [] } = useMyMedications();
	const { data: seList = [] } = useMySideEffects();

	const now = new Date();

	const activeMeds = (meds as PatientMedicationOut[]).filter(
		m => !m.ended_at || new Date(m.ended_at) >= now
	);
	const todayMedTasks = (tasks ?? []).filter(
		t => t.task_type === 'medication_log' && t.status === 'pending'
	);
	const pendingTestCount = (tasks ?? []).filter(
		t => t.task_type === 'test' && t.status === 'pending'
	).length;
	const activeSE = (seList as PatientSideEffectOut[]).filter(r => !r.resolved);

	const firstName = patientMe?.full_name.split(' ')[0] ?? '';

	return (
		<div className='p-6 space-y-6'>
			{/* Date + greeting */}
			<div>
				<p className='text-xs text-muted-foreground capitalize'>{formatDateRu(now)}</p>
				<h1 className='text-xl font-semibold mt-1'>
					Добрый день{firstName ? `, ${firstName}` : ''}!
				</h1>
				<p className='text-sm text-muted-foreground'>Как вы себя чувствуете сегодня?</p>
			</div>

			{/* Stat cards */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
				<StatCard
					icon={<Pill size={18} className='text-docassist-primary' />}
					iconBg='bg-docassist-primary-subtle'
					count={`${activeMeds.length - todayMedTasks.length}/${activeMeds.length}`}
					countLabel='ПРИЁМОВ СЕГОДНЯ'
					title='Препараты'
					subtitle={`${activeMeds.length - todayMedTasks.length} из ${activeMeds.length} принято сегодня`}
					to='/drugs'
				/>
				<StatCard
					icon={<ClipboardList size={18} className='text-purple-600' />}
					iconBg='bg-purple-100'
					count={pendingTestCount}
					countLabel='ОЖИДАЕТ'
					title='Тесты'
					subtitle={pendingTestCount === 1 ? '1 ожидает прохождения' : `${pendingTestCount} ожидают прохождения`}
					badge={pendingTestCount > 0 ? String(pendingTestCount) : undefined}
					to='/tests'
				/>
				<StatCard
					icon={<AlertTriangle size={18} className='text-amber-600' />}
					iconBg='bg-amber-100'
					count={activeSE.length}
					countLabel='АКТИВНЫХ'
					title='Побочные эффекты'
					subtitle={`${activeSE.length} активных`}
					badge={activeSE.length > 0 ? String(activeSE.length) : undefined}
					to='/side-effects'
				/>
			</div>

			{/* Current medications list */}
			{activeMeds.length > 0 && (
				<div>
					<h2 className='text-sm font-semibold mb-2'>Текущие препараты</h2>
					<div className='space-y-1.5'>
						{activeMeds.map(med => (
							<div
								key={med.id}
								className='flex items-center justify-between bg-white border border-border rounded-lg px-4 py-2.5'
							>
								<div className='flex items-center gap-2'>
									<span className='w-2 h-2 rounded-full bg-docassist-primary shrink-0' />
									<span className='text-sm font-medium'>{med.medication?.inn ?? '—'}</span>
									{med.dose_mg && (
										<span className='text-xs text-muted-foreground'>
											{med.dose_mg} {med.unit ?? 'мг'}
										</span>
									)}
								</div>
								<span className='text-xs text-muted-foreground'>{med.frequency ?? 'Не отмечено'}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
