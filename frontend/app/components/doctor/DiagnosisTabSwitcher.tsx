import type { components } from '@shared/types/schema';

type DiagnosisOut = components['schemas']['DiagnosisOut'];

interface Props {
	diagnoses: DiagnosisOut[];
	activeId: string | null;
	onChange: (id: string) => void;
}

export function DiagnosisTabSwitcher({ diagnoses, activeId, onChange }: Props) {
	if (!diagnoses.length) return null;

	return (
		<div className='flex gap-1 flex-wrap'>
			{diagnoses.map(d => (
				<button
					key={d.id}
					onClick={() => onChange(d.id)}
					className={[
						'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
						activeId === d.id
							? 'bg-primary text-primary-foreground border-primary'
							: 'bg-white text-gray-600 border-border hover:bg-gray-50',
					].join(' ')}
				>
					{d.icd_code} — {d.name}
				</button>
			))}
		</div>
	);
}
