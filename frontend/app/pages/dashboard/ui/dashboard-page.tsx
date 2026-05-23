import { AlertTriangle, ClipboardList, Pill } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { useDashboardData } from '../hooks/use-dashboard-data';

import { StatCard } from './components/stat-card';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];

export const DashboardPage: React.FC = () => {
	const { t } = useTranslation('common');
	const dashboard = useDashboardData();
	const greetingName = dashboard.firstName ? t('patientPortal.greetingName', { name: dashboard.firstName }) : '';

	return (
		<div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-6'>
			{/* Date + greeting */}
			<div>
				<p className='text-xs text-muted-foreground capitalize'>{date.formatDateRu(dashboard.now)}</p>
				<h1 className='text-xl font-semibold mt-1'>{t('patientPortal.greeting', { name: greetingName })}</h1>
				<p className='text-sm text-muted-foreground'>{t('patientPortal.feeling')}</p>
			</div>

			{/* Stat cards */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
				<StatCard
					icon={<Pill size={18} className='text-docassist-primary' />}
					iconBg='bg-docassist-primary-subtle'
					count={`${dashboard.takenMedCount}/${dashboard.activeMeds.length}`}
					countLabel={t('patientPortal.medsToday')}
					title={t('nav.drugs')}
					subtitle={t('patientPortal.medsTaken', {
						taken: dashboard.takenMedCount,
						total: dashboard.activeMeds.length,
					})}
					to='/drugs'
				/>
				<StatCard
					icon={<ClipboardList size={18} className='text-purple-600' />}
					iconBg='bg-purple-100'
					count={dashboard.pendingTestCount}
					countLabel={t('patientPortal.pending')}
					title={t('nav.tests')}
					subtitle={
						dashboard.pendingTestCount === 1
							? t('patientPortal.testsPending_one')
							: t('patientPortal.testsPending_other', { count: dashboard.pendingTestCount })
					}
					badge={dashboard.pendingTestCount > 0 ? String(dashboard.pendingTestCount) : undefined}
					to='/tests'
				/>
				<StatCard
					icon={<AlertTriangle size={18} className='text-amber-600' />}
					iconBg='bg-amber-100'
					count={dashboard.activeSE.length}
					countLabel={t('patientPortal.active')}
					title={t('nav.sideEffects')}
					subtitle={t('patientPortal.sideEffectsActive', { count: dashboard.activeSE.length })}
					badge={dashboard.activeSE.length > 0 ? String(dashboard.activeSE.length) : undefined}
					to='/side-effects'
				/>
			</div>

			{/* Current medications list */}
			{dashboard.activeMeds.length > 0 && (
				<div>
					<h2 className='text-sm font-semibold mb-2'>{t('patientPortal.currentMeds')}</h2>
					<div className='space-y-1.5'>
						{dashboard.activeMeds.map(med => {
							const typedMed = med as PatientMedicationOut;

							return (
								<div
									key={typedMed.id}
									className='flex items-center justify-between bg-card text-card-foreground border border-border rounded-lg px-4 py-2.5'
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
									<span className='text-xs text-muted-foreground'>
										{typedMed.frequency ?? t('patientPortal.notLogged')}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
