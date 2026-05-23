import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateDiagnosisMutation } from '@shared/api/diagnoses';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
};

export const DiagnosisForm: React.FC<Props> = props => {
	const { t } = useTranslation('common');
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
				<div className='w-28 space-y-1'>
					<Label className='text-xs'>{t('diagnosis.icdCode')} *</Label>
					<Input
						type='text'
						required
						placeholder={t('diagnosis.icdPlaceholder')}
						value={icdCode}
						onChange={e => setIcdCode(e.target.value)}
						className='h-7 text-xs'
					/>
				</div>
				<div className='flex-1 space-y-1'>
					<Label className='text-xs'>{t('diagnosis.name')} *</Label>
					<Input
						type='text'
						required
						placeholder={t('diagnosis.namePlaceholder')}
						value={name}
						onChange={e => setName(e.target.value)}
						className='h-7 text-xs'
					/>
				</div>
			</div>
			<div className='flex gap-4 items-center'>
				<label className='flex items-center gap-1.5 text-xs cursor-pointer'>
					<input
						type='checkbox'
						checked={isPrimary}
						onChange={e => setIsPrimary(e.target.checked)}
						className='accent-docassist-primary'
					/>
					{t('diagnosis.isPrimary')}
				</label>
				<div className='space-y-1'>
					<Label className='text-xs'>{t('diagnosis.dateDiagnosed')}</Label>
					<Input
						type='date'
						value={dateDiagnosed}
						onChange={e => setDateDiagnosed(e.target.value)}
						className='h-7 text-xs w-36'
					/>
				</div>
			</div>
			<div className='space-y-1'>
				<Label className='text-xs'>{t('diagnosis.notes')}</Label>
				<Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className='text-xs min-h-0' />
			</div>
			{mutation.error && <p className='text-xs text-destructive'>{t('diagnosis.error')}</p>}
			<div className='flex gap-2'>
				<Button type='button' variant='outline' size='sm' onClick={props.onCancel}>
					{t('diagnosis.cancel')}
				</Button>
				<Button type='submit' size='sm' disabled={mutation.isPending}>
					{mutation.isPending ? t('diagnosis.saving') : t('diagnosis.save')}
				</Button>
			</div>
		</form>
	);
};
