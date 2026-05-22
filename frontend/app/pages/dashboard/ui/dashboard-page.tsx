import { AlertTriangle, ClipboardList, Pill } from 'lucide-react';
import React from 'react';

import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { useDashboardData } from '../hooks/use-dashboard-data';

import { StatCard } from './components/stat-card';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

export const DashboardPage: React.FC = () => {
	const dashboard = useDashboardData();

	return (
		<div className='p-6 space-y-6'>
			{/* Date + greeting */}
			<div>
				<p className='text-xs text-muted-foreground capitalize'>{date.formatDateRu(dashboard.now)}</p>
				<h1 className='text-xl font-semibold mt-1'>
					Добрый день{dashboard.firstName ? `, ${dashboard.firstName}` : ''}!
				</h1>
				<p className='text-sm text-muted-foreground'>Как вы себя чувствуете сегодня?</p>
			</div>

			{/* Stat cards */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
				<StatCard
					icon={<Pill size={18} className='text-docassist-primary' />}
					iconBg='bg-docassist-primary-subtle'
					count={`${dashboard.takenMedCount}/${dashboard.activeMeds.length}`}
					countLabel='ПРИЁМОВ СЕГОДНЯ'
					title='Препараты'
					subtitle={`${dashboard.takenMedCount} из ${dashboard.activeMeds.length} принято сегодня`}
					to='/drugs'
				/>
				<StatCard
					icon={<ClipboardList size={18} className='text-purple-600' />}
					iconBg='bg-purple-100'
					count={dashboard.pendingTestCount}
					countLabel='ОЖИДАЕТ'
					title='Тесты'
					subtitle={
						dashboard.pendingTestCount === 1
							? '1 ожидает прохождения'
							: `${dashboard.pendingTestCount} ожидают прохождения`
					}
					badge={dashboard.pendingTestCount > 0 ? String(dashboard.pendingTestCount) : undefined}
					to='/tests'
				/>
				<StatCard
					icon={<AlertTriangle size={18} className='text-amber-600' />}
					iconBg='bg-amber-100'
					count={dashboard.activeSE.length}
					countLabel='АКТИВНЫХ'
					title='Побочные эффекты'
					subtitle={`${dashboard.activeSE.length} активных`}
					badge={dashboard.activeSE.length > 0 ? String(dashboard.activeSE.length) : undefined}
					to='/side-effects'
				/>
			</div>

			{/* Current medications list */}
			{dashboard.activeMeds.length > 0 && (
				<div>
					<h2 className='text-sm font-semibold mb-2'>Текущие препараты</h2>
					<div className='space-y-1.5'>
						{dashboard.activeMeds.map(med => {
							const typedMed = med as PatientMedicationOut;

							return (
								<div
									key={typedMed.id}
									className='flex items-center justify-between bg-white border border-border rounded-lg px-4 py-2.5'
								>
									<div className='flex items-center gap-2'>
										<span className='w-2 h-2 rounded-full bg-docassist-primary shrink-0' />
										<span className='text-sm font-medium'>{typedMed.medication?.inn ?? '—'}</span>
										{typedMed.dose_mg && (
											<span className='text-xs text-muted-foreground'>
												{typedMed.dose_mg} {typedMed.unit ?? 'мг'}
											</span>
										)}
									</div>
									<span className='text-xs text-muted-foreground'>{typedMed.frequency ?? 'Не отмечено'}</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
