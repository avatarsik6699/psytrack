import { Copy } from 'lucide-react';
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

type WizardStep = 1 | 2 | 3 | 'credentials';

type FormData = {
	fullName: string;
	birthDate: string;
	gender: string;
};

type Props = {
	onClose: () => void;
};

function StepDots({ step, total }: { step: number; total: number }) {
	return (
		<div className='flex items-center gap-1.5 justify-center mb-4'>
			{Array.from({ length: total }).map((_, i) => (
				<span
					key={i}
					className={`w-2 h-2 rounded-full transition-colors ${i + 1 === step ? 'bg-docassist-primary' : 'bg-muted-foreground/30'}`}
				/>
			))}
		</div>
	);
}

export const AddPatientModal: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [step, setStep] = useState<WizardStep>(1);
	const [created, setCreated] = useState<PatientCreatedOut | null>(null);
	const [form, setForm] = useState<FormData>({ fullName: '', birthDate: '', gender: '' });
	const [copiedBoth, setCopiedBoth] = useState(false);
	const mutation = useCreatePatientMutation();

	const set = (key: keyof FormData) => (value: string) => setForm(f => ({ ...f, [key]: value }));

	const handleSubmit = () => {
		mutation.mutate(
			{
				full_name: form.fullName,
				birth_date: form.birthDate || null,
				gender: form.gender || null,
			},
			{
				onSuccess: result => {
					setCreated(result as PatientCreatedOut);
					setStep('credentials');
				},
			}
		);
	};

	const handleCopyBoth = () => {
		if (!created) return;
		void navigator.clipboard.writeText(`login: ${created.temp_login}\npassword: ${created.temp_password}`);
		setCopiedBoth(true);
		setTimeout(() => setCopiedBoth(false), 2000);
	};

	if (step === 'credentials' && created) {
		return (
			<ModalOverlay>
				<h2 className='text-lg font-semibold mb-1'>{t('addPatient.createdTitle')}</h2>
				<p className='text-sm text-muted-foreground mb-4'>{t('addPatient.createdHint')}</p>
				<CopyField label={t('addPatient.login')} value={created.temp_login} />
				<CopyField label={t('addPatient.password')} value={created.temp_password} />
				<Button variant='outline' className='w-full mt-2 gap-2' onClick={handleCopyBoth}>
					<Copy size={14} />
					{copiedBoth ? t('addPatient.copied') : t('addPatient.copyBoth')}
				</Button>
				<Button className='mt-3 w-full' onClick={props.onClose}>
					{t('actions.done')}
				</Button>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClose={props.onClose}>
			<StepDots step={step as number} total={3} />

			{step === 1 && (
				<>
					<h2 className='text-lg font-semibold mb-1'>{t('addPatient.step1Title')}</h2>
					<p className='text-sm text-muted-foreground mb-4'>{t('addPatient.step1Hint')}</p>
					<div className='space-y-3'>
						<div className='space-y-1.5'>
							<Label>{t('addPatient.fullName')} *</Label>
							<Input
								type='text'
								required
								value={form.fullName}
								onChange={e => set('fullName')(e.target.value)}
								placeholder={t('addPatient.fullNamePlaceholder')}
							/>
						</div>
					</div>
					<div className='flex gap-2 mt-6'>
						<Button type='button' variant='outline' className='flex-1' onClick={props.onClose}>
							{t('actions.cancel')}
						</Button>
						<Button type='button' className='flex-1' disabled={!form.fullName.trim()} onClick={() => setStep(2)}>
							{t('addPatient.next')}
						</Button>
					</div>
				</>
			)}

			{step === 2 && (
				<>
					<h2 className='text-lg font-semibold mb-1'>{t('addPatient.step2Title')}</h2>
					<p className='text-sm text-muted-foreground mb-4'>{t('addPatient.step2Hint')}</p>
					<div className='space-y-3'>
						<div className='space-y-1.5'>
							<Label>{t('addPatient.birthDate')}</Label>
							<Input type='date' value={form.birthDate} onChange={e => set('birthDate')(e.target.value)} />
						</div>
						<div className='space-y-1.5'>
							<Label>{t('addPatient.gender')}</Label>
							<Select value={form.gender} onValueChange={set('gender')}>
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
					</div>
					<div className='flex gap-2 mt-6'>
						<Button type='button' variant='outline' className='flex-1' onClick={() => setStep(1)}>
							{t('addPatient.back')}
						</Button>
						<Button type='button' className='flex-1' onClick={() => setStep(3)}>
							{t('addPatient.next')}
						</Button>
					</div>
				</>
			)}

			{step === 3 && (
				<>
					<h2 className='text-lg font-semibold mb-1'>{t('addPatient.step3Title')}</h2>
					<p className='text-sm text-muted-foreground mb-4'>{t('addPatient.step3Hint')}</p>
					<div className='space-y-2 bg-muted/50 rounded-lg p-3 text-sm'>
						<div className='flex justify-between'>
							<span className='text-muted-foreground'>{t('addPatient.fullName')}</span>
							<span className='font-medium'>{form.fullName}</span>
						</div>
						{form.birthDate && (
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>{t('addPatient.birthDate')}</span>
								<span className='font-medium'>{form.birthDate}</span>
							</div>
						)}
						{form.gender && (
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>{t('addPatient.gender')}</span>
								<span className='font-medium'>
									{form.gender === 'male'
										? t('addPatient.genderMale')
										: form.gender === 'female'
											? t('addPatient.genderFemale')
											: t('addPatient.genderOther')}
								</span>
							</div>
						)}
					</div>
					{mutation.error && <p className='text-xs text-destructive mt-2'>{t('addPatient.error')}</p>}
					<div className='flex gap-2 mt-6'>
						<Button type='button' variant='outline' className='flex-1' onClick={() => setStep(2)}>
							{t('addPatient.back')}
						</Button>
						<Button
							type='button'
							className='flex-1 bg-docassist-primary text-white hover:bg-docassist-primary-hover'
							disabled={mutation.isPending}
							onClick={handleSubmit}
						>
							{mutation.isPending ? t('addPatient.creating') : t('addPatient.create')}
						</Button>
					</div>
				</>
			)}
		</ModalOverlay>
	);
};
