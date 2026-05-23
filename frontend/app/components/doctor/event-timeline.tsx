import { Activity, AlertTriangle, CheckCircle2, ClipboardList, FileText, Pill, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePatientEvents } from '@shared/api/events';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type EventLogOut = components['schemas']['EventLogOut'];

type Props = {
	patientId: string;
};

type EventMeta = {
	icon: React.ElementType;
	color: string;
	labelKey: string;
};

const EVENT_META: Record<string, EventMeta> = {
	assessment_completed: {
		icon: ClipboardList,
		color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
		labelKey: 'events.assessmentCompleted',
	},
	medication_taken: {
		icon: Pill,
		color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
		labelKey: 'events.medicationTaken',
	},
	medication_missed: {
		icon: Pill,
		color: 'text-red-500 bg-red-50 dark:bg-red-950/30',
		labelKey: 'events.medicationMissed',
	},
	side_effect_reported: {
		icon: AlertTriangle,
		color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
		labelKey: 'events.sideEffectReported',
	},
	side_effect_resolved: {
		icon: CheckCircle2,
		color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
		labelKey: 'events.sideEffectResolved',
	},
	patient_created: {
		icon: User,
		color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
		labelKey: 'events.patientCreated',
	},
	profile_updated: { icon: FileText, color: 'text-slate-500 bg-muted', labelKey: 'events.profileUpdated' },
};

const FALLBACK_META: EventMeta = {
	icon: Activity,
	color: 'text-muted-foreground bg-muted',
	labelKey: 'events.unknown',
};

function formatPayload(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object') return null;
	const entries = Object.entries(payload as Record<string, unknown>)
		.filter(([, v]) => v !== null && v !== undefined && v !== '')
		.map(([k, v]) => `${k}: ${String(v)}`);
	return entries.length ? entries.join(' · ') : null;
}

export const EventTimeline: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const size = 20;
	const eventsQuery = usePatientEvents(props.patientId, page, size);

	if (eventsQuery.isLoading) {
		return <p className='text-xs text-muted-foreground'>{t('events.loading')}</p>;
	}

	const items: EventLogOut[] = eventsQuery.data?.items ?? [];
	const total: number = eventsQuery.data?.total ?? 0;
	const totalPages = Math.ceil(total / size);

	if (items.length === 0) {
		return <p className='text-xs text-muted-foreground'>{t('events.empty')}</p>;
	}

	return (
		<div className='space-y-1'>
			{items.map(e => {
				const meta = EVENT_META[e.event_type] ?? FALLBACK_META;
				const Icon = meta.icon;
				const label = t(meta.labelKey, { defaultValue: e.event_type });
				const detail = formatPayload(e.payload);

				return (
					<div key={e.id} className='flex gap-3 py-2.5 border-t border-border first:border-0'>
						<div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
							<Icon size={14} />
						</div>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium leading-tight'>{label}</p>
							{detail && <p className='text-xs text-muted-foreground mt-0.5 truncate'>{detail}</p>}
						</div>
						<div className='text-xs text-muted-foreground shrink-0 pt-0.5'>{date.formatDateTimeRu(e.occurred_at)}</div>
					</div>
				);
			})}

			{totalPages > 1 && (
				<div className='flex justify-between items-center pt-2 border-t border-border'>
					<button
						className='text-xs text-primary hover:underline disabled:opacity-40'
						disabled={page <= 1}
						onClick={() => setPage(p => p - 1)}
					>
						← {t('events.prev')}
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {totalPages}
					</span>
					<button
						className='text-xs text-primary hover:underline disabled:opacity-40'
						disabled={page >= totalPages}
						onClick={() => setPage(p => p + 1)}
					>
						{t('events.next')} →
					</button>
				</div>
			)}
		</div>
	);
};
