import React from 'react';
import { useTranslation } from 'react-i18next';

import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];
type ScoreSnapshot = components['schemas']['ScoreSnapshot'];
type MedSummary = components['schemas']['MedSummary'];

type PatientCardData = PatientOut & {
	latest_scores: ScoreSnapshot[];
	active_medications_summary: MedSummary[];
};

const BORDER_COLOR: Record<PatientOut['card_color'], string> = {
	red: 'border-status-critical',
	yellow: 'border-status-warning',
	green: 'border-status-ok',
	gray: 'border-status-none',
};

const AVATAR_BG: Record<PatientOut['card_color'], string> = {
	red: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
	yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
	green: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
	gray: 'bg-muted text-muted-foreground',
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
	const { t } = useTranslation('common');
	const age = date.ageLabel(props.patient.birth_date);
	const borderClass = BORDER_COLOR[props.patient.card_color];
	const avatarClass = AVATAR_BG[props.patient.card_color];
	const badgeClass = STATUS_BADGE[props.patient.card_color];
	const statusLabel = {
		red: t('status.critical'),
		yellow: t('status.warning'),
		green: t('status.ok'),
		gray: t('status.none'),
	}[props.patient.card_color];

	const meds = props.patient.active_medications_summary ?? [];
	const scores = props.patient.latest_scores ?? [];

	const initials = props.patient.full_name
		.split(' ')
		.map(w => w[0] ?? '')
		.join('')
		.slice(0, 2)
		.toUpperCase();

	const medsText = meds
		.slice(0, 2)
		.map(m => (m.dose_mg ? `${m.inn} ${m.dose_mg}` : m.inn))
		.join(', ');

	return (
		<div
			className={`flex flex-col bg-gray-50 text-card-foreground rounded-xl border-2 ${borderClass} shadow-sm cursor-pointer hover:shadow-md transition-shadow p-4 min-h-40 gap-3`}
			onClick={props.onClick}
		>
			<div className='flex items-start gap-3'>
				<div
					className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${avatarClass}`}
				>
					{initials}
				</div>
				<div className='min-w-0 flex-1'>
					<p className='font-semibold text-foreground text-sm leading-tight truncate'>{props.patient.full_name}</p>
					{age && <p className='text-xs text-muted-foreground mt-0.5'>{age}</p>}
				</div>
				<span
					className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${badgeClass}`}
				>
					<span className='w-1 h-1 rounded-full inline-block' style={{ background: 'currentColor' }} />
					{statusLabel}
				</span>
			</div>

			<div className='flex-1 space-y-1.5'>
				{scores.length > 0 && (
					<div className='flex flex-wrap gap-1'>
						{scores.slice(0, 2).map(s => (
							<span
								key={s.scale_code}
								className='text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground bg-muted/50'
							>
								{s.scale_code} {s.score}
							</span>
						))}
					</div>
				)}
				{medsText && (
					<p className='text-[11px] text-muted-foreground truncate'>
						💊 {medsText}
						{meds.length > 2 && ` +${meds.length - 2}`}
					</p>
				)}
			</div>

			<div className='text-[10px] text-muted-foreground text-right'>{t('actions.open')} →</div>
		</div>
	);
};
