import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];

type ScoreSnapshot = { scale_code: string; score: number; severity_label: string };
type MedSummary = { inn: string; dose_mg: number | null; unit: string | null };
type PatientOutExtended = PatientOut & {
	adherence_percent?: number | null;
	latest_scores?: ScoreSnapshot[];
	active_medications_summary?: MedSummary[];
};

const COLOR_STRIP: Record<PatientOut['card_color'], string> = {
	red: 'bg-red-500',
	yellow: 'bg-yellow-400',
	green: 'bg-green-500',
	gray: 'bg-gray-300',
};

const SEVERITY_COLOR: Record<string, string> = {
	Minimal: 'bg-green-100 text-green-800',
	Mild: 'bg-yellow-100 text-yellow-800',
	Moderate: 'bg-orange-100 text-orange-800',
	'Mod. Severe': 'bg-red-100 text-red-700',
	Severe: 'bg-red-200 text-red-900',
};

interface PatientCardProps {
	patient: PatientOutExtended;
	onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
	const colorClass = COLOR_STRIP[patient.card_color];
	const scores = patient.latest_scores ?? [];
	const meds = patient.active_medications_summary ?? [];
	const adherence = patient.adherence_percent;

	return (
		<div
			className='flex items-stretch gap-0 bg-white rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden'
			onClick={onClick}
		>
			<div className={`w-1 shrink-0 ${colorClass}`} />
			<div className='flex-1 min-w-0 p-4 space-y-2'>
				<div className='flex items-center justify-between gap-2'>
					<p className='font-medium text-gray-900 truncate'>{patient.full_name}</p>
					<p className='text-xs text-gray-500 shrink-0'>{patient.birth_date ?? '—'}</p>
				</div>

				{/* Score + severity pills */}
				{scores.length > 0 && (
					<div className='flex flex-wrap gap-1.5'>
						{scores.map(s => (
							<span
								key={s.scale_code}
								className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${SEVERITY_COLOR[s.severity_label] ?? 'bg-gray-100 text-gray-600'}`}
							>
								{s.scale_code} {s.score} — {s.severity_label}
							</span>
						))}
					</div>
				)}

				{/* Adherence bar */}
				{adherence !== null && adherence !== undefined && (
					<div className='flex items-center gap-2'>
						<span className='text-xs text-muted-foreground'>Adh.</span>
						<div className='flex-1 bg-gray-100 rounded-full h-1.5'>
							<div
								className={`h-1.5 rounded-full ${adherence >= 80 ? 'bg-green-500' : adherence >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
								style={{ width: `${Math.min(adherence, 100)}%` }}
							/>
						</div>
						<span className='text-xs font-medium'>{adherence}%</span>
					</div>
				)}

				{/* Active med chips */}
				{meds.length > 0 && (
					<div className='flex flex-wrap gap-1'>
						{meds.slice(0, 3).map((m, i) => (
							<span
								key={i}
								className='text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full'
							>
								{m.inn}
							</span>
						))}
						{meds.length > 3 && (
							<span className='text-[11px] text-muted-foreground'>+{meds.length - 3}</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
