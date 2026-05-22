import React, { useMemo, useState } from 'react';

import { usePatients } from '@shared/api/patients';
import { useRouter } from '@shared/hooks/use-router';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { AddPatientModal } from '@/components/doctor/add-patient-modal';
import { PatientCard } from '@/components/doctor/patient-card';

type PatientOut = components['schemas']['PatientOut'];
type Filter = 'all' | 'attention';

const DoctorIndexRoute: React.FC = () => {
	const patientsQuery = usePatients();
	const patients = (patientsQuery.data ?? []) as PatientOut[];
	const [showAdd, setShowAdd] = useState(false);
	const [filter, setFilter] = useState<Filter>('all');
	const [search, setSearch] = useState('');
	const router = useRouter();

	const summary = useMemo(
		() => ({
			critical: patients.filter(p => p.card_color === 'red').length,
			warning: patients.filter(p => p.card_color === 'yellow').length,
			ok: patients.filter(p => p.card_color === 'green').length,
			none: patients.filter(p => p.card_color === 'gray').length,
		}),
		[patients]
	);

	const displayed = useMemo(() => {
		let list = patients;
		if (filter === 'attention') {
			list = list.filter(p => p.card_color === 'red' || p.card_color === 'yellow');
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			list = list.filter(p => p.full_name.toLowerCase().includes(q));
		}
		return list;
	}, [patients, filter, search]);

	if (patientsQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 max-w-3xl'>
			<div className='flex items-start justify-between mb-5'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900'>Пациенты</h1>
					<p className='text-xs text-muted-foreground mt-0.5'>{date.formatDateRu(date.now())}</p>
				</div>
				<button
					className='flex items-center gap-1.5 px-4 py-2 text-sm bg-docassist-primary text-white rounded-lg hover:bg-docassist-primary-hover transition-colors font-medium'
					onClick={() => setShowAdd(true)}
				>
					+ Добавить пациента
				</button>
			</div>

			{patients.length > 0 && (
				<div className='flex flex-wrap gap-2 mb-4'>
					{summary.critical > 0 && (
						<span
							className='flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full cursor-pointer border text-status-critical-fg bg-status-critical-bg border-status-critical-bg'
							onClick={() => setFilter(filter === 'all' ? 'attention' : 'all')}
						>
							<span className='w-1.5 h-1.5 rounded-full bg-status-critical' />
							{summary.critical} критический
						</span>
					)}
					{summary.warning > 0 && (
						<span
							className='flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full cursor-pointer border text-status-warning-fg bg-status-warning-bg border-status-warning-bg'
							onClick={() => setFilter(filter === 'all' ? 'attention' : 'all')}
						>
							<span className='w-1.5 h-1.5 rounded-full bg-status-warning' />
							{summary.warning} внимание
						</span>
					)}
					{summary.ok > 0 && (
						<span className='flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border text-status-ok-fg bg-status-ok-bg border-status-ok-bg'>
							<span className='w-1.5 h-1.5 rounded-full bg-status-ok' />
							{summary.ok} хорошо
						</span>
					)}
					{summary.none > 0 && (
						<span className='flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border text-status-none-fg bg-status-none-bg border-status-none-bg'>
							<span className='w-1.5 h-1.5 rounded-full bg-status-none' />
							{summary.none} без данных
						</span>
					)}
				</div>
			)}

			<div className='flex items-center gap-3 mb-4'>
				<div className='flex items-center rounded-lg border border-border bg-background p-0.5'>
					<button
						type='button'
						onClick={() => setFilter('all')}
						className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
							filter === 'all' ? 'bg-gray-900 text-white' : 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Все
					</button>
					<button
						type='button'
						onClick={() => setFilter('attention')}
						className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
							filter === 'attention' ? 'bg-gray-900 text-white' : 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Требуют внимания
					</button>
				</div>
				<input
					type='text'
					placeholder='Поиск по имени…'
					value={search}
					onChange={e => setSearch(e.target.value)}
					className='flex-1 h-8 rounded-lg border border-border bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
				/>
			</div>

			{displayed.length === 0 ? (
				<p className='text-muted-foreground text-sm py-8 text-center'>
					{patients.length === 0 ? 'Пациенты ещё не добавлены.' : 'Ничего не найдено.'}
				</p>
			) : (
				<div className='flex flex-col gap-3'>
					{displayed.map(p => (
						<PatientCard key={p.id} patient={p} onClick={() => router.navigate(`/doctor/patients/${p.id}`)} />
					))}
				</div>
			)}

			{showAdd && <AddPatientModal onClose={() => setShowAdd(false)} />}
		</div>
	);
};

export default DoctorIndexRoute;
