import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router';

import { usePatientTasks } from '@shared/api/tasks';
import { useMyAssignedScales } from '@shared/api/scales';

import type { components } from '@shared/types/schema';

type PatientScaleOut = components['schemas']['PatientScaleOut'];

function statusBadge(scale: PatientScaleOut, pendingScaleIds: Set<string>) {
	if (pendingScaleIds.has(scale.id)) {
		return (
			<span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
				Ожидает
			</span>
		);
	}
	return null;
}

export function meta() {
	return [{ title: 'Тесты — PsychTrack' }];
}

export default function TestsPage() {
	const { data: scales = [], isLoading } = useMyAssignedScales();
	const { data: tasks = [] } = usePatientTasks();

	const pendingScaleIds = new Set(
		(tasks ?? [])
			.filter(t => t.task_type === 'test' && t.status === 'pending' && t.reference_id)
			.map(t => t.reference_id as string)
	);

	if (isLoading) {
		return (
			<div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>
		);
	}

	return (
		<div className='p-6 space-y-4'>
			<div>
				<h1 className='text-lg font-semibold'>Тесты</h1>
				<p className='text-sm text-muted-foreground'>Опросники, назначенные врачом</p>
			</div>

			{scales.length === 0 && (
				<p className='text-sm text-muted-foreground'>Нет назначенных тестов.</p>
			)}

			<div className='space-y-3'>
				{(scales as PatientScaleOut[]).map(ps => (
					<div
						key={ps.id}
						className='bg-white border border-border rounded-lg p-4 flex items-center gap-4'
					>
						<div className='shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center'>
							<ClipboardList size={18} className='text-amber-600' />
						</div>
						<div className='flex-1 min-w-0'>
							<div className='flex items-center gap-2'>
								<span className='font-medium text-sm'>{ps.scale?.name ?? ps.scale_id}</span>
								{statusBadge(ps, pendingScaleIds)}
							</div>
							{ps.scale?.code && (
								<p className='text-xs text-muted-foreground mt-0.5'>
									{ps.scale.code} · Каждые {ps.frequency_days} дн.
								</p>
							)}
						</div>
						<Link
							to={`/assessment/${ps.id}`}
							className='shrink-0 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity'
						>
							Пройти
						</Link>
					</div>
				))}
			</div>
		</div>
	);
}
