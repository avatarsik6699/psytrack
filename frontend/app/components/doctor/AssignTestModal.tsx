import { useState } from 'react';

import { useDiagnoses } from '@shared/api/diagnoses';
import { useAssignScaleMutation, useScales } from '@shared/api/scales';

interface Props {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
}

export function AssignTestModal({ patientId, onSuccess, onCancel }: Props) {
	const [scaleId, setScaleId] = useState('');
	const [diagnosisId, setDiagnosisId] = useState('');
	const [frequencyDays, setFrequencyDays] = useState(7);

	const { data: scales = [] } = useScales();
	const { data: diagnoses = [] } = useDiagnoses(patientId);
	const mutation = useAssignScaleMutation(patientId);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!scaleId || !diagnosisId) return;
		mutation.mutate(
			{ scale_id: scaleId, diagnosis_id: diagnosisId, frequency_days: frequencyDays },
			{ onSuccess },
		);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-3 space-y-2 pt-3 border-t border-border'>
			<div>
				<label className='block text-xs font-medium mb-1'>Scale *</label>
				<select
					value={scaleId}
					onChange={e => setScaleId(e.target.value)}
					className='w-full border border-border rounded px-2 py-1.5 text-xs'
					required
				>
					<option value=''>Select scale…</option>
					{scales.map(s => (
						<option key={s.id} value={s.id}>
							{s.name}
						</option>
					))}
				</select>
			</div>
			<div>
				<label className='block text-xs font-medium mb-1'>Diagnosis *</label>
				<select
					value={diagnosisId}
					onChange={e => setDiagnosisId(e.target.value)}
					className='w-full border border-border rounded px-2 py-1.5 text-xs'
					required
				>
					<option value=''>Select diagnosis…</option>
					{diagnoses.map(d => (
						<option key={d.id} value={d.id}>
							{d.icd_code} — {d.name}
						</option>
					))}
				</select>
			</div>
			<div>
				<label className='block text-xs font-medium mb-1'>Repeat every (days) *</label>
				<input
					type='number'
					min={1}
					value={frequencyDays}
					onChange={e => setFrequencyDays(Number(e.target.value))}
					className='w-24 border border-border rounded px-2 py-1.5 text-xs'
					required
				/>
			</div>
			{mutation.error && <p className='text-xs text-red-500'>Failed to assign scale.</p>}
			<div className='flex gap-2'>
				<button
					type='button'
					onClick={onCancel}
					className='px-2 py-1 text-xs border border-border rounded hover:bg-gray-50'
				>
					Cancel
				</button>
				<button
					type='submit'
					disabled={mutation.isPending}
					className='px-2 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50'
				>
					{mutation.isPending ? 'Assigning…' : 'Assign'}
				</button>
			</div>
		</form>
	);
}
