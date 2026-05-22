import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { useMySideEffects, useUpdateSideEffectMutation } from '@shared/api/side-effects';
import { SEWizard } from '@/components/patient/SEWizard';

import type { components } from '@shared/types/schema';

type PatientSideEffectOut = components['schemas']['PatientSideEffectOut'];

const SEVERITY_LABELS: Record<number, string> = {
	0: 'Нет',
	1: 'Лёгкая',
	2: 'Умеренная',
	3: 'Тяжёлая',
	4: 'Очень тяжёлая',
};

function SECard({ se }: { se: PatientSideEffectOut }) {
	const updateMutation = useUpdateSideEffectMutation(se.id);

	const handleResolve = () => {
		updateMutation.mutate({ resolved: true });
	};

	const severityColor =
		(se.severity ?? 0) >= 3 ? 'bg-red-500' : (se.severity ?? 0) >= 2 ? 'bg-amber-500' : 'bg-yellow-400';

	return (
		<div className='bg-white border border-border rounded-lg flex overflow-hidden'>
			<div className={`w-1 shrink-0 ${severityColor}`} />
			<div className='flex-1 p-4 flex items-center gap-3'>
				<div className='flex-1 min-w-0'>
					<div className='flex items-center gap-2 flex-wrap'>
						<span className='font-medium text-sm'>{se.se.name_ru}</span>
						{se.severity !== null && (
							<span className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'>
								UKU {se.severity}
							</span>
						)}
						{se.severity !== null && (
							<span className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700'>
								{SEVERITY_LABELS[se.severity] ?? ''}
							</span>
						)}
					</div>
					<p className='text-xs text-muted-foreground mt-0.5'>
						{se.se.body_system ?? '—'} · с{' '}
						{se.started_at
							? new Date(se.started_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
							: '—'}
					</p>
				</div>
				{!se.resolved && (
					<button
						disabled={updateMutation.isPending}
						onClick={handleResolve}
						className='shrink-0 px-3 py-1.5 text-xs border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-40'
					>
						✓ Прошёл
					</button>
				)}
			</div>
		</div>
	);
}

export function meta() {
	return [{ title: 'Побочные эффекты — PsychTrack' }];
}

export default function SideEffectsPage() {
	const { data = [], isLoading } = useMySideEffects();
	const [showWizard, setShowWizard] = useState(false);

	const records = data as PatientSideEffectOut[];
	const active = records.filter(r => !r.resolved);
	const resolved = records.filter(r => r.resolved);

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 space-y-4'>
			<div className='flex items-start justify-between'>
				<div>
					<h1 className='text-lg font-semibold'>Побочные эффекты</h1>
					<p className='text-sm text-muted-foreground'>Сообщайте об изменениях самочувствия</p>
				</div>
				<button
					onClick={() => setShowWizard(true)}
					className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity'
				>
					+ Добавить
				</button>
			</div>

			{active.length > 0 && (
				<div className='space-y-2'>
					<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
						Активные ({active.length})
					</p>
					{active.map(se => <SECard key={se.id} se={se} />)}
				</div>
			)}

			{resolved.length > 0 && (
				<div className='space-y-2'>
					<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
						Прошедшие ({resolved.length})
					</p>
					{resolved.map(se => <SECard key={se.id} se={se} />)}
				</div>
			)}

			{records.length === 0 && (
				<div className='flex flex-col items-center py-12 text-center'>
					<AlertTriangle size={32} className='text-muted-foreground mb-3' />
					<p className='text-sm text-muted-foreground'>Побочные эффекты не зарегистрированы.</p>
				</div>
			)}

			{showWizard && (
				<SEWizard
					onClose={() => setShowWizard(false)}
					onSuccess={() => setShowWizard(false)}
				/>
			)}
		</div>
	);
}
