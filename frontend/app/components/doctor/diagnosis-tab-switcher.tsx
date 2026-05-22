import React from 'react';

import type { components } from '@shared/types/schema';

type DiagnosisOut = components['schemas']['DiagnosisOut'];

type Props = {
	diagnoses: DiagnosisOut[];
	activeId: string | null;
	onChange: (id: string) => void;
};

export const DiagnosisTabSwitcher: React.FC<Props> = props => {
	if (!props.diagnoses.length) return null;

	return (
		<div className='flex gap-1 flex-wrap'>
			{props.diagnoses.map(d => (
				<button
					key={d.id}
					onClick={() => props.onChange(d.id)}
					className={[
						'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
						props.activeId === d.id
							? 'bg-primary text-primary-foreground border-primary'
							: 'bg-white text-gray-600 border-border hover:bg-gray-50',
					].join(' ')}
				>
					{d.icd_code} — {d.name}
				</button>
			))}
		</div>
	);
};
