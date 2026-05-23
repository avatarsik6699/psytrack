import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreatePatientMutation } from '@shared/api/patients';
import type { components } from '@shared/types/schema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CopyField } from './components/copy-field';
import { ModalOverlay } from './components/modal-overlay';

type PatientCreatedOut = components['schemas']['PatientCreatedOut'];

type Step = 'form' | 'credentials';

type Props = {
	onClose: () => void;
};

export const AddPatientModal: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [step, setStep] = useState<Step>('form');
	const [created, setCreated] = useState<PatientCreatedOut | null>(null);
	const [fullName, setFullName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [gender, setGender] = useState('');
	const mutation = useCreatePatientMutation();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate(
			{
				full_name: fullName,
				birth_date: birthDate || null,
				gender: gender || null,
			},
			{
				onSuccess: result => {
					setCreated(result);
					setStep('credentials');
				},
			}
		);
	};

	if (step === 'credentials' && created) {
		return (
			<ModalOverlay>
				<h2 className='text-lg font-semibold mb-1'>{t('addPatient.createdTitle')}</h2>
				<p className='text-sm text-muted-foreground mb-4'>{t('addPatient.createdHint')}</p>
				<CopyField label={t('addPatient.login')} value={created.temp_login} />
				<CopyField label={t('addPatient.password')} value={created.temp_password} />
				<Button className='mt-4 w-full' onClick={props.onClose}>
					{t('actions.done')}
				</Button>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClose={props.onClose}>
			<h2 className='text-lg font-semibold mb-4'>{t('addPatient.title')}</h2>
			<form onSubmit={handleSubmit} className='space-y-3'>
				<div className='space-y-1.5'>
					<Label>{t('addPatient.fullName')}</Label>
					<Input
						type='text'
						required
						value={fullName}
						onChange={e => setFullName(e.target.value)}
					/>
				</div>
				<div className='space-y-1.5'>
					<Label>{t('addPatient.birthDate')}</Label>
					<Input
						type='date'
						value={birthDate}
						onChange={e => setBirthDate(e.target.value)}
					/>
				</div>
				<div className='space-y-1.5'>
					<Label>{t('addPatient.gender')}</Label>
					<Select value={gender} onValueChange={setGender}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={t('addPatient.genderEmpty')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='male'>{t('addPatient.genderMale')}</SelectItem>
							<SelectItem value='female'>{t('addPatient.genderFemale')}</SelectItem>
							<SelectItem value='other'>{t('addPatient.genderOther')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{mutation.error && <p className='text-xs text-destructive'>{t('addPatient.error')}</p>}
				<div className='flex gap-2 pt-1'>
					<Button type='button' variant='outline' className='flex-1' onClick={props.onClose}>
						{t('actions.cancel')}
					</Button>
					<Button type='submit' className='flex-1' disabled={mutation.isPending}>
						{mutation.isPending ? t('addPatient.creating') : t('addPatient.create')}
					</Button>
				</div>
			</form>
		</ModalOverlay>
	);
};
