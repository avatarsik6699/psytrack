import { Archive, Pencil } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

import { Button } from '@/components/ui/button';

type PatientOut = components['schemas']['PatientOut'];
type DiagnosisOut = components['schemas']['DiagnosisOut'];

type PatientOutExtended = PatientOut & {
	adherence_percent?: number | null;
	latest_scores?: { scale_code: string; score: number; severity_label: string }[];
	active_medications_summary?: { inn: string; dose_mg: number | null; unit: string | null }[];
};

const STATUS_BADGE: Record<PatientOut['card_color'], string> = {
	red: 'text-status-critical-fg bg-status-critical-bg',
	yellow: 'text-status-warning-fg bg-status-warning-bg',
	green: 'text-status-ok-fg bg-status-ok-bg',
	gray: 'text-status-none-fg bg-status-none-bg',
};

const AVATAR_BG: Record<PatientOut['card_color'], string> = {
	red: 'bg-rose-200 text-rose-700',
	yellow: 'bg-amber-200 text-amber-700',
	green: 'bg-teal-200 text-teal-700',
	gray: 'bg-muted text-muted-foreground',
};

function genderLabel(gender: string | null, t: (key: string) => string): string {
	if (gender === 'male' || gender === 'Male' || gender === 'М') return t('gender.male');
	if (gender === 'female' || gender === 'Female' || gender === 'Ж') return t('gender.female');
	return gender ?? '';
}

type Props = {
	patient: PatientOutExtended;
	diagnoses?: DiagnosisOut[];
	onEdit: () => void;
	onArchive: () => void;
};

export const PatientHeader: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const initials = props.patient.full_name
		.split(' ')
		.map(w => w[0] ?? '')
		.join('')
		.slice(0, 2)
		.toUpperCase();

	const age = date.ageLabel(props.patient.birth_date);
	const gender = genderLabel(props.patient.gender, t);
	const statusLabel = {
		red: t('status.critical'),
		yellow: t('status.warning'),
		green: t('status.stable'),
		gray: t('status.none'),
	}[props.patient.card_color];
	const badgeClass = STATUS_BADGE[props.patient.card_color];
	const avatarClass = AVATAR_BG[props.patient.card_color];
	const diagnoses = props.diagnoses ?? [];

	return (
		<div className='flex items-start justify-between gap-4'>
			<div className='flex items-start gap-4'>
				<div
					className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 ${avatarClass}`}
				>
					{initials}
				</div>

				<div>
					<h1 className='text-xl font-bold text-foreground leading-tight'>{props.patient.full_name}</h1>
					<div className='flex flex-wrap items-center gap-2 mt-1'>
						{(age || gender) && (
							<span className='text-sm text-muted-foreground'>{[age, gender].filter(Boolean).join(' · ')}</span>
						)}
						<span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeClass}`}>
							<span className='w-1.5 h-1.5 rounded-full' style={{ background: 'currentColor' }} />
							{statusLabel}
						</span>
						{diagnoses.map(d => (
							<span
								key={d.id}
								className='text-xs px-2 py-0.5 rounded-full border border-docassist-primary/30 text-docassist-primary bg-docassist-primary-subtle'
							>
								{d.name}
							</span>
						))}
					</div>
				</div>
			</div>

			<div className='flex items-center gap-2 shrink-0'>
				<Button variant='outline' size='sm' onClick={props.onEdit}>
					<Pencil size={13} />
					{t('actions.edit')}
				</Button>
				{!props.patient.archived_at && (
					<Button variant='outline' size='sm' onClick={props.onArchive}>
						<Archive size={13} />
						{t('actions.archive')}
					</Button>
				)}
			</div>
		</div>
	);
};
