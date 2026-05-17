import { useState } from 'react';

import { DiagnosisForm } from '@/components/doctor/DiagnosisForm';
import { useDiagnoses } from '@shared/api/diagnoses';

interface Props {
	patientId: string;
}

export function DiagnosisList({ patientId }: Props) {
	const { data: diagnoses = [] } = useDiagnoses(patientId);
	const [adding, setAdding] = useState(false);

	return (
		<section className='bg-white rounded-lg border border-border p-4'>
			<div className='flex justify-between items-center mb-3'>
				<h2 className='font-semibold text-sm'>Diagnoses</h2>
				<button
					className='text-xs text-primary hover:underline'
					onClick={() => setAdding(v => !v)}
				>
					{adding ? 'Cancel' : '+ Add'}
				</button>
			</div>
			{diagnoses.length === 0 && !adding && (
				<p className='text-xs text-muted-foreground'>No diagnoses recorded.</p>
			)}
			{diagnoses.map(d => (
				<div
					key={d.id}
					className='flex items-center justify-between py-2 border-t border-border first:border-0'
				>
					<div>
						<span className='font-mono text-xs text-gray-500 mr-2'>{d.icd_code}</span>
						<span className='text-sm'>{d.name}</span>
						{d.is_primary && (
							<span className='ml-2 text-xs text-primary font-medium'>Primary</span>
						)}
					</div>
					{d.date_diagnosed && (
						<span className='text-xs text-muted-foreground ml-4'>{d.date_diagnosed}</span>
					)}
				</div>
			))}
			{adding && (
				<DiagnosisForm
					patientId={patientId}
					onSuccess={() => setAdding(false)}
					onCancel={() => setAdding(false)}
				/>
			)}
		</section>
	);
}
