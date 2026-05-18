import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];

const COLOR_STRIP: Record<PatientOut['card_color'], string> = {
	red: 'bg-red-500',
	yellow: 'bg-yellow-400',
	green: 'bg-green-500',
	gray: 'bg-gray-300',
};

interface PatientCardProps {
	patient: PatientOut;
	onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
	const colorClass = COLOR_STRIP[patient.card_color];

	return (
		<div
			className='flex items-center gap-3 p-4 bg-white rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow'
			onClick={onClick}
		>
			<div className={`w-1 self-stretch rounded-full ${colorClass}`} />
			<div className='flex-1 min-w-0'>
				<p className='font-medium text-gray-900 truncate'>{patient.full_name}</p>
				<p className='text-xs text-gray-500'>{patient.birth_date ?? '—'}</p>
			</div>
		</div>
	);
}
