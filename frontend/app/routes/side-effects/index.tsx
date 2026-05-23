import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMySideEffects } from '@shared/api/side-effects';
import type { components } from '@shared/types/schema';

import { SEWizard } from '@/components/patient/se-wizard';
import { Skeleton } from '@/components/ui/skeleton';

import { SECard } from './components/se-card';

type PatientSideEffectOut = components['schemas']['PatientSideEffectOut'];

export function meta() {
	return [{ title: 'Побочные эффекты — PsychTrack' }];
}

const SideEffectsPage: React.FC = () => {
	const { t } = useTranslation('common');
	const sideEffectsQuery = useMySideEffects();
	const [showWizard, setShowWizard] = useState(false);

	const records = (sideEffectsQuery.data ?? []) as PatientSideEffectOut[];
	const active = records.filter(r => !r.resolved);
	const resolved = records.filter(r => r.resolved);

	if (sideEffectsQuery.isLoading) {
		return (
			<div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-3'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className='h-14 w-full' />
				))}
			</div>
		);
	}

	return (
		<div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-4'>
			<div className='flex items-start justify-between'>
				<div>
					<h1 className='text-lg font-semibold'>{t('nav.sideEffects')}</h1>
					<p className='text-sm text-muted-foreground'>{t('patientPortal.sideEffectsHint')}</p>
				</div>
				<button
					onClick={() => setShowWizard(true)}
					className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity'
				>
					+ {t('actions.add')}
				</button>
			</div>

			{active.length > 0 && (
				<div className='space-y-2'>
					<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
						{t('patientPortal.activeGroup')} ({active.length})
					</p>
					{active.map(se => (
						<SECard key={se.id} se={se} />
					))}
				</div>
			)}

			{resolved.length > 0 && (
				<div className='space-y-2'>
					<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
						{t('patientPortal.resolvedGroup')} ({resolved.length})
					</p>
					{resolved.map(se => (
						<SECard key={se.id} se={se} />
					))}
				</div>
			)}

			{records.length === 0 && (
				<div className='flex flex-col items-center py-12 text-center'>
					<AlertTriangle size={32} className='text-muted-foreground mb-3' />
					<p className='text-sm text-muted-foreground'>{t('patientPortal.noSideEffects')}</p>
				</div>
			)}

			{showWizard && <SEWizard onClose={() => setShowWizard(false)} onSuccess={() => setShowWizard(false)} />}
		</div>
	);
};

export default SideEffectsPage;
