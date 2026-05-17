import type { components } from '@shared/types/schema';

type PatientOut = components['schemas']['PatientOut'];

interface Props {
	patient: PatientOut;
	onEdit: () => void;
	onArchive: () => void;
}

export function PatientHeader({ patient, onEdit, onArchive }: Props) {
	return (
		<div className='flex items-start justify-between bg-white p-6 rounded-lg border border-border'>
			<div>
				<h1 className='text-2xl font-semibold'>{patient.full_name}</h1>
				<p className='text-sm text-muted-foreground mt-1'>
					{patient.birth_date ?? '—'} · {patient.gender ?? '—'}
				</p>
				{patient.email && <p className='text-sm text-muted-foreground'>{patient.email}</p>}
				{patient.archived_at && <span className='mt-1 inline-block text-xs text-red-500 font-medium'>Archived</span>}
			</div>
			<div className='flex gap-2'>
				<button className='px-3 py-1.5 text-sm border border-border rounded-md hover:bg-gray-50' onClick={onEdit}>
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
	);
}
