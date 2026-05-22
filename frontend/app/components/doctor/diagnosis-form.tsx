import React, { useState } from 'react';

import { useCreateDiagnosisMutation } from '@shared/api/diagnoses';

type Props = {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
};

export const DiagnosisForm: React.FC<Props> = props => {
	const [icdCode, setIcdCode] = useState('');
	const [name, setName] = useState('');
	const [isPrimary, setIsPrimary] = useState(false);
	const [dateDiagnosed, setDateDiagnosed] = useState('');
	const [notes, setNotes] = useState('');
	const mutation = useCreateDiagnosisMutation(props.patientId);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate(
			{
				icd_code: icdCode,
				name,
				is_primary: isPrimary,
				date_diagnosed: dateDiagnosed || null,
				notes: notes || null,
			},
			{ onSuccess: props.onSuccess }
		);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-3 space-y-2 pt-3 border-t border-border'>
			<div className='flex gap-2'>
				<div className='w-28'>
					<label className='block text-xs font-medium mb-1'>ICD code *</label>
					<input
						type='text'
						required
						placeholder='F32.1'
						value={icdCode}
						onChange={e => setIcdCode(e.target.value)}
						className='w-full border border-border rounded px-2 py-1.5 text-xs'
					/>
				</div>
				<div className='flex-1'>
					<label className='block text-xs font-medium mb-1'>Diagnosis name *</label>
					<input
						type='text'
						required
						placeholder='e.g. Moderate depressive episode'
						value={name}
						onChange={e => setName(e.target.value)}
						className='w-full border border-border rounded px-2 py-1.5 text-xs'
					/>
				</div>
			</div>
			<div className='flex gap-4 items-center'>
				<label className='flex items-center gap-1.5 text-xs'>
					<input type='checkbox' checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} />
					Primary diagnosis
				</label>
				<div>
					<label className='block text-xs font-medium mb-1'>Date diagnosed</label>
					<input
						type='date'
						value={dateDiagnosed}
						onChange={e => setDateDiagnosed(e.target.value)}
						className='border border-border rounded px-2 py-1 text-xs'
					/>
				</div>
			</div>
			<div>
				<label className='block text-xs font-medium mb-1'>Notes</label>
				<textarea
					value={notes}
					onChange={e => setNotes(e.target.value)}
					rows={2}
					className='w-full border border-border rounded px-2 py-1.5 text-xs resize-none'
				/>
			</div>
			{mutation.error && <p className='text-xs text-red-500'>Failed to save diagnosis.</p>}
			<div className='flex gap-2'>
				<button
					type='button'
					className='px-2 py-1 text-xs border border-border rounded hover:bg-gray-50'
					onClick={props.onCancel}
				>
					Cancel
				</button>
				<button
					type='submit'
					disabled={mutation.isPending}
					className='px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50'
				>
					{mutation.isPending ? 'Saving…' : 'Save'}
				</button>
			</div>
		</form>
	);
};
