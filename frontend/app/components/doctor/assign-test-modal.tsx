import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDiagnoses } from '@shared/api/diagnoses';
import { useAssignScaleMutation, useScales } from '@shared/api/scales';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
	patientId: string;
	onSuccess: () => void;
	onCancel: () => void;
};

export const AssignTestModal: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [scaleId, setScaleId] = useState('');
	const [diagnosisId, setDiagnosisId] = useState('');
	const [frequencyDays, setFrequencyDays] = useState(7);

	const scalesQuery = useScales();
	const scales = scalesQuery.data ?? [];
	const diagnosesQuery = useDiagnoses(props.patientId);
	const diagnoses = diagnosesQuery.data ?? [];
	const mutation = useAssignScaleMutation(props.patientId);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!scaleId || !diagnosisId) return;
		mutation.mutate(
			{ scale_id: scaleId, diagnosis_id: diagnosisId, frequency_days: frequencyDays },
			{ onSuccess: props.onSuccess }
		);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-3 space-y-2 pt-3 border-t border-border'>
			<div className='space-y-1'>
				<Label className='text-xs'>{t('assignTest.scale')} *</Label>
				<Select value={scaleId} onValueChange={setScaleId} required>
					<SelectTrigger className='w-full h-7 text-xs'>
						<SelectValue placeholder={t('assignTest.scalePlaceholder')} />
					</SelectTrigger>
					<SelectContent>
						{scales.map(s => (
							<SelectItem key={s.id} value={s.id}>
								{s.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='space-y-1'>
				<Label className='text-xs'>{t('assignTest.diagnosis')} *</Label>
				<Select value={diagnosisId} onValueChange={setDiagnosisId} required>
					<SelectTrigger className='w-full h-7 text-xs'>
						<SelectValue placeholder={t('assignTest.diagnosisPlaceholder')} />
					</SelectTrigger>
					<SelectContent>
						{diagnoses.map(d => (
							<SelectItem key={d.id} value={d.id}>
								{d.icd_code} — {d.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='space-y-1'>
				<Label className='text-xs'>{t('assignTest.frequency')} *</Label>
				<Input
					type='number'
					min={1}
					value={frequencyDays}
					onChange={e => setFrequencyDays(Number(e.target.value))}
					className='w-24 h-7 text-xs'
					required
				/>
			</div>
			{mutation.error && <p className='text-xs text-destructive'>{t('assignTest.error')}</p>}
			<div className='flex gap-2'>
				<Button type='button' variant='outline' size='sm' onClick={props.onCancel}>
					{t('assignTest.cancel')}
				</Button>
				<Button type='submit' size='sm' disabled={mutation.isPending}>
					{mutation.isPending ? t('assignTest.assigning') : t('assignTest.assign')}
				</Button>
			</div>
		</form>
	);
};
