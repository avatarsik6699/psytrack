import { useState } from 'react';

import { useAssignMedicationMutation, useMedicationSearch } from '@shared/api/medications';
import type { components } from '@shared/types/schema';

type MedicationReferenceOut = components['schemas']['MedicationReferenceOut'];

interface Props {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
}

export function MedicationAssignForm({ patientId, onSuccess, onCancel }: Props) {
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<MedicationReferenceOut | null>(null);
	const [doseMg, setDoseMg] = useState('');
	const [unit, setUnit] = useState('mg');
	const [frequency, setFrequency] = useState('');
	const [dosePrecision, setDosePrecision] = useState<'exact' | 'approx' | 'range'>('exact');
	const { data: results = [] } = useMedicationSearch(query);
	const mutation = useAssignMedicationMutation(patientId);

	const handleSelect = (med: MedicationReferenceOut) => {
		setSelected(med);
		setQuery('');
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selected) return;
		mutation.mutate(
			{
				medication_id: selected.id,
				dose_mg: doseMg ? parseFloat(doseMg) : null,
				unit: unit || null,
				frequency: frequency || null,
				dose_precision: dosePrecision,
			},
			{ onSuccess }
		);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-3 space-y-2 pt-3 border-t border-border'>
			<div className='relative'>
				<label className='block text-xs font-medium mb-1'>Medication *</label>
				{selected ? (
					<div className='flex items-center gap-2 border border-border rounded px-2 py-1.5 text-xs bg-gray-50'>
						<span className='font-medium'>{selected.inn}</span>
						<button
							type='button'
							className='text-muted-foreground hover:text-gray-800'
							onClick={() => setSelected(null)}
						>
							×
						</button>
					</div>
				) : (
					<>
						<input
							type='text'
							placeholder='Search by INN (type ≥ 2 chars)'
							value={query}
							onChange={e => setQuery(e.target.value)}
							className='w-full border border-border rounded px-2 py-1.5 text-xs'
						/>
						{results.length > 0 && query.length >= 2 && (
							<ul className='absolute z-10 w-full mt-1 bg-white border border-border rounded shadow-sm text-xs'>
								{results.map(med => (
									<li
										key={med.id}
										className='px-3 py-2 hover:bg-gray-50 cursor-pointer'
										onClick={() => handleSelect(med)}
									>
										<span className='font-medium'>{med.inn}</span>
										{med.brand_names.length > 0 && (
											<span className='text-muted-foreground ml-2'>
												({med.brand_names.join(', ')})
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</>
				)}
			</div>

			<div className='flex gap-2'>
				<div>
					<label className='block text-xs font-medium mb-1'>Dose</label>
					<input
						type='number'
						step='0.01'
						min='0'
						placeholder='50'
						value={doseMg}
						onChange={e => setDoseMg(e.target.value)}
						className='w-20 border border-border rounded px-2 py-1.5 text-xs'
					/>
				</div>
				<div>
					<label className='block text-xs font-medium mb-1'>Unit</label>
					<select
						value={unit}
						onChange={e => setUnit(e.target.value)}
						className='border border-border rounded px-2 py-1.5 text-xs'
					>
						<option value='mg'>mg</option>
						<option value='mcg'>mcg</option>
						<option value='ml'>ml</option>
						<option value='g'>g</option>
					</select>
				</div>
				<div>
					<label className='block text-xs font-medium mb-1'>Precision</label>
					<select
						value={dosePrecision}
						onChange={e => setDosePrecision(e.target.value as 'exact' | 'approx' | 'range')}
						className='border border-border rounded px-2 py-1.5 text-xs'
					>
						<option value='exact'>Exact</option>
						<option value='approx'>Approx</option>
						<option value='range'>Range</option>
					</select>
				</div>
			</div>

			<div>
				<label className='block text-xs font-medium mb-1'>Frequency</label>
				<input
					type='text'
					placeholder='e.g. once daily, PRN'
					value={frequency}
					onChange={e => setFrequency(e.target.value)}
					className='w-full border border-border rounded px-2 py-1.5 text-xs'
				/>
			</div>

			{mutation.error && (
				<p className='text-xs text-red-500'>Failed to assign medication.</p>
			)}
			<div className='flex gap-2'>
				<button
					type='button'
					className='px-2 py-1 text-xs border border-border rounded hover:bg-gray-50'
					onClick={onCancel}
				>
					Cancel
				</button>
				<button
					type='submit'
					disabled={!selected || mutation.isPending}
					className='px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50'
				>
					{mutation.isPending ? 'Assigning…' : 'Assign'}
				</button>
			</div>
		</form>
	);
}
