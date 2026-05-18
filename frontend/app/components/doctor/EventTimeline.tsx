import { useState } from 'react';

import { usePatientEvents } from '@shared/api/events';
import type { components } from '@shared/types/schema';

type EventLogOut = components['schemas']['EventLogOut'];

interface EventTimelineProps {
	patientId: string;
}

export function EventTimeline({ patientId }: EventTimelineProps) {
	const [page, setPage] = useState(1);
	const size = 20;
	const { data, isLoading } = usePatientEvents(patientId, page, size);

	if (isLoading) {
		return <p className='text-xs text-muted-foreground'>Loading timeline…</p>;
	}

	const items: EventLogOut[] = data?.items ?? [];
	const total: number = data?.total ?? 0;
	const totalPages = Math.ceil(total / size);

	if (items.length === 0) {
		return <p className='text-xs text-muted-foreground'>No events recorded yet.</p>;
	}

	return (
		<div className='space-y-2'>
			{items.map((e) => (
					<div key={e.id} className='flex gap-3 py-2 border-t border-border first:border-0'>
						<div className='text-xs text-muted-foreground w-32 shrink-0 pt-0.5'>
							{new Date(e.occurred_at).toLocaleString('ru-RU', {
								day: '2-digit',
								month: '2-digit',
								year: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
							})}
						</div>
						<div className='flex-1 min-w-0'>
							<span className='text-sm font-medium'>{e.event_type}</span>
							{e.payload && (
								<p className='text-xs text-muted-foreground mt-0.5 break-all'>
									{JSON.stringify(e.payload)}
								</p>
							)}
						</div>
					</div>
			))}

			{totalPages > 1 && (
				<div className='flex justify-between items-center pt-2'>
					<button
						className='text-xs text-primary hover:underline disabled:opacity-40'
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						← Prev
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {totalPages}
					</span>
					<button
						className='text-xs text-primary hover:underline disabled:opacity-40'
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						Next →
					</button>
				</div>
			)}
		</div>
	);
}
