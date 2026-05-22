import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];

type ScoreSnapshot = {
	scale_code: string;
	scale_name: string;
	score: number;
	severity_label: string;
};

type MedSummary = {
	inn: string;
	dose_mg: number | null;
	unit: string | null;
	frequency: string | null;
};

type PatientOutExtended = PatientOut & {
	adherence_percent?: number | null;
	latest_scores?: ScoreSnapshot[];
	active_medications_summary?: MedSummary[];
};

const SEVERITY_COLOR: Record<string, string> = {
	Minimal: 'bg-green-100 text-green-800',
	Mild: 'bg-yellow-100 text-yellow-800',
	Moderate: 'bg-orange-100 text-orange-800',
	'Mod. Severe': 'bg-red-100 text-red-700',
	Severe: 'bg-red-200 text-red-900',
};

const CARD_COLOR_CHIP: Record<string, string> = {
	red: 'bg-red-100 text-red-700 border-red-200',
	yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
	green: 'bg-green-100 text-green-700 border-green-200',
	gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

const CARD_COLOR_LABEL: Record<string, string> = {
	red: 'Urgent',
	yellow: 'Monitoring',
	green: 'Stable',
	gray: 'Inactive',
};

interface Props {
	patient: PatientOutExtended;
	onEdit: () => void;
	onArchive: () => void;
}

export function PatientHeader({ patient, onEdit, onArchive }: Props) {
	const scores = patient.latest_scores ?? [];
	const meds = patient.active_medications_summary ?? [];
	const adherence = patient.adherence_percent;
	const statusClass = CARD_COLOR_CHIP[patient.card_color] ?? CARD_COLOR_CHIP.gray;
	const statusLabel = CARD_COLOR_LABEL[patient.card_color] ?? 'Inactive';

	return (
		<div className='bg-white p-6 rounded-lg border border-border space-y-3'>
			<div className='flex items-start justify-between'>
				<div className='flex items-center gap-3'>
					{/* Colored initials avatar */}
					<div
						className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0 ${patient.card_color === 'red' ? 'bg-red-500' : patient.card_color === 'yellow' ? 'bg-yellow-400' : patient.card_color === 'green' ? 'bg-green-500' : 'bg-gray-400'}`}
					>
						{patient.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
					</div>
					<div>
						<h1 className='text-xl font-semibold leading-tight'>{patient.full_name}</h1>
						<p className='text-sm text-muted-foreground mt-0.5'>
							{patient.birth_date ?? '—'} · {patient.gender ?? '—'}
						</p>
						{patient.email && (
							<p className='text-xs text-muted-foreground'>{patient.email}</p>
						)}
					</div>
				</div>

				<div className='flex gap-2 items-center'>
					{/* Status chip */}
					<span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClass}`}>
						{statusLabel}
					</span>
					<button
						className='px-3 py-1.5 text-sm border border-border rounded-md hover:bg-gray-50'
						onClick={onEdit}
					>
						Edit
					</button>
					{!patient.archived_at && (
						<button
							className='px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50'
							onClick={onArchive}
						>
							Archive
						</button>
					)}
				</div>
			</div>

			{/* Severity badge pills */}
			{scores.length > 0 && (
				<div className='flex flex-wrap gap-2'>
					{scores.map(s => (
						<div key={s.scale_code} className='flex items-center gap-1'>
							<span className='text-xs font-medium text-gray-500'>{s.scale_code}</span>
							<span className='text-xs font-bold text-gray-800'>{s.score}</span>
							<span
								className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${SEVERITY_COLOR[s.severity_label] ?? 'bg-gray-100 text-gray-600'}`}
							>
								{s.severity_label}
							</span>
						</div>
					))}
				</div>
			)}

			<div className='flex flex-wrap items-center gap-4'>
				{/* Adherence bar */}
				{adherence !== null && adherence !== undefined && (
					<div className='flex items-center gap-2'>
						<span className='text-xs text-muted-foreground'>Adherence</span>
						<div className='w-24 bg-gray-100 rounded-full h-1.5'>
							<div
								className={`h-1.5 rounded-full ${adherence >= 80 ? 'bg-green-500' : adherence >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
								style={{ width: `${Math.min(adherence, 100)}%` }}
							/>
						</div>
						<span className='text-xs font-medium'>{adherence}%</span>
					</div>
				)}

				{/* Active medication chips */}
				{meds.length > 0 && (
					<div className='flex flex-wrap gap-1'>
						{meds.map((m, i) => (
							<span
								key={i}
								className='text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full'
							>
								{m.inn}
								{m.dose_mg ? ` ${m.dose_mg}${m.unit ?? ''}` : ''}
							</span>
						))}
					</div>
				)}
			</div>

			{patient.archived_at && (
				<span className='inline-block text-xs text-red-500 font-medium'>Archived</span>
			)}
		</div>
	);
}
