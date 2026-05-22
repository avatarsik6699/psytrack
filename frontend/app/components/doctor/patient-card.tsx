import { ChevronRight } from 'lucide-react';
import React from 'react';

import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];
type ScoreSnapshot = components['schemas']['ScoreSnapshot'];
type MedSummary = components['schemas']['MedSummary'];

type PatientCardData = PatientOut & {
	latest_scores: ScoreSnapshot[];
	active_medications_summary: MedSummary[];
};

const STRIP_COLOR: Record<PatientOut['card_color'], string> = {
	red: 'bg-status-critical',
	yellow: 'bg-status-warning',
	green: 'bg-status-ok',
	gray: 'bg-status-none',
};

const STATUS_LABEL: Record<PatientOut['card_color'], string> = {
	red: 'Критический',
	yellow: 'Внимание',
	green: 'Хорошо',
	gray: 'Без данных',
};

const STATUS_BADGE: Record<PatientOut['card_color'], string> = {
	red: 'text-status-critical-fg bg-status-critical-bg',
	yellow: 'text-status-warning-fg bg-status-warning-bg',
	green: 'text-status-ok-fg bg-status-ok-bg',
	gray: 'text-status-none-fg bg-status-none-bg',
};

type Props = {
	patient: PatientCardData;
	onClick?: () => void;
};

export const PatientCard: React.FC<Props> = props => {
	const age = date.ageLabel(props.patient.birth_date);
	const strip = STRIP_COLOR[props.patient.card_color];
	const badgeClass = STATUS_BADGE[props.patient.card_color];
	const statusLabel = STATUS_LABEL[props.patient.card_color];
	const meds = props.patient.active_medications_summary ?? [];
	const scores = props.patient.latest_scores ?? [];

	const medsText = meds
		.slice(0, 3)
		.map(m => (m.dose_mg ? `${m.inn} ${m.dose_mg}${m.unit ?? 'мг'}` : m.inn))
		.join(' · ');

	return (
		<div
			className='flex items-stretch bg-white rounded-xl border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden'
			onClick={props.onClick}
		>
			<div className={`w-1 shrink-0 ${strip}`} />

			<div className='flex-1 min-w-0 p-4 space-y-2'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<p className='font-semibold text-gray-900 truncate'>
							{props.patient.full_name}
							{age ? `, ${age}` : ''}
						</p>
					</div>
					<span
						className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeClass}`}
					>
						<span className='w-1.5 h-1.5 rounded-full inline-block' style={{ background: 'currentColor' }} />
						{statusLabel}
					</span>
				</div>

				{scores.length > 0 && (
					<div className='flex flex-wrap gap-1.5'>
						{scores.map(s => (
							<span
								key={s.scale_code}
								className='text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted/50'
							>
								{s.scale_code} · {s.score} ({s.severity_label})
							</span>
						))}
					</div>
				)}

				{medsText && (
					<p className='text-xs text-muted-foreground truncate'>
						<span className='mr-1'>💊</span>
						{medsText}
						{meds.length > 3 && ` +${meds.length - 3}`}
					</p>
				)}
			</div>

			<div className='flex items-center pr-4'>
				<div className='flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors'>
					Открыть <ChevronRight size={13} />
				</div>
			</div>
		</div>
	);
};
