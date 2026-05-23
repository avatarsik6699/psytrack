import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAssignMedicationMutation, useMedicationBrowse } from '@shared/api/medications';
import type { components } from '@shared/types/schema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MedicationReferenceOut = components['schemas']['MedicationReferenceOut'];

type Props = {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
};

export const MedicationAssignForm: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<MedicationReferenceOut | null>(null);
	const [showDropdown, setShowDropdown] = useState(false);
	const [doseMg, setDoseMg] = useState('');
	const [unit, setUnit] = useState('mg');
	const [frequency, setFrequency] = useState('');
	const [dosePrecision, setDosePrecision] = useState<'exact' | 'approx' | 'range'>('exact');
	const browseQuery = useMedicationBrowse(query);
	const results = (browseQuery.data ?? []) as MedicationReferenceOut[];
	const mutation = useAssignMedicationMutation(props.patientId);

	const handleSelect = (med: MedicationReferenceOut) => {
		setSelected(med);
		setQuery('');
		setShowDropdown(false);
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
			{ onSuccess: props.onSuccess }
		);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-3 space-y-2 pt-3 border-t border-border'>
			<div className='relative space-y-1'>
				<Label className='text-xs'>{t('medication.label')} *</Label>
				{selected ? (
					<div className='flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-muted/50'>
						<span className='font-medium flex-1'>{selected.inn}</span>
						<button
							type='button'
							className='text-muted-foreground hover:text-foreground'
							onClick={() => setSelected(null)}
						>
							×
						</button>
					</div>
				) : (
					<>
						<Input
							type='text'
							placeholder={t('medication.searchPlaceholder')}
							value={query}
							onChange={e => {
								setQuery(e.target.value);
								setShowDropdown(true);
							}}
							onFocus={() => setShowDropdown(true)}
							onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
							className='h-7 text-xs'
						/>
						{showDropdown && results.length > 0 && (
							<ul className='absolute z-10 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-sm text-xs'>
								{results.map(med => (
									<li
										key={med.id}
										className='px-3 py-2 hover:bg-muted cursor-pointer'
										onClick={() => handleSelect(med)}
									>
										<span className='font-medium'>{med.inn}</span>
										{med.brand_names.length > 0 && (
											<span className='text-muted-foreground ml-2'>({med.brand_names.join(', ')})</span>
										)}
									</li>
								))}
							</ul>
						)}
					</>
				)}
			</div>

			<div className='flex gap-2'>
				<div className='space-y-1'>
					<Label className='text-xs'>{t('medication.dose')}</Label>
					<Input
						type='number'
						step='0.01'
						min='0'
						placeholder='50'
						value={doseMg}
						onChange={e => setDoseMg(e.target.value)}
						className='w-20 h-7 text-xs'
					/>
				</div>
				<div className='space-y-1'>
					<Label className='text-xs'>{t('medication.unit')}</Label>
					<Select value={unit} onValueChange={setUnit}>
						<SelectTrigger className='w-16 h-7 text-xs'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='mg'>{t('medication.unitMg')}</SelectItem>
							<SelectItem value='mcg'>{t('medication.unitMcg')}</SelectItem>
							<SelectItem value='ml'>{t('medication.unitMl')}</SelectItem>
							<SelectItem value='g'>{t('medication.unitG')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='space-y-1'>
					<Label className='text-xs'>{t('medication.precision')}</Label>
					<Select value={dosePrecision} onValueChange={v => setDosePrecision(v as 'exact' | 'approx' | 'range')}>
						<SelectTrigger className='w-24 h-7 text-xs'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='exact'>{t('medication.exact')}</SelectItem>
							<SelectItem value='approx'>{t('medication.approx')}</SelectItem>
							<SelectItem value='range'>{t('medication.range')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className='space-y-1'>
				<Label className='text-xs'>{t('medication.frequency')}</Label>
				<Input
					type='text'
					placeholder={t('medication.frequencyPlaceholder')}
					value={frequency}
					onChange={e => setFrequency(e.target.value)}
					className='h-7 text-xs'
				/>
			</div>

			{mutation.error && <p className='text-xs text-destructive'>{t('medication.error')}</p>}
			<div className='flex gap-2'>
				<Button type='button' variant='outline' size='sm' onClick={props.onCancel}>
					{t('medication.cancel')}
				</Button>
				<Button type='submit' size='sm' disabled={!selected || mutation.isPending}>
					{mutation.isPending ? t('medication.assigning') : t('medication.assign')}
				</Button>
			</div>
		</form>
	);
};
