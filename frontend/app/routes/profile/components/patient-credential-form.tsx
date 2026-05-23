import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { usePatientCredentialForm } from '../hooks/use-patient-credential-form';

type Props = {
	currentLogin?: string | null;
};

export const PatientCredentialForm: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const form = usePatientCredentialForm();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void form.submit();
	};

	return (
		<form onSubmit={handleSubmit} className='grid gap-3'>
			<div className='rounded-lg border border-border bg-muted/40 px-3 py-2'>
				<p className='text-[11px] uppercase text-muted-foreground'>{t('profile.currentLogin')}</p>
				<p className='mt-0.5 font-mono text-sm font-medium'>{props.currentLogin ?? t('notAssigned')}</p>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='current-password'>{t('currentPassword')}</Label>
				<Input
					id='current-password'
					type='password'
					value={form.currentPassword}
					onChange={event => form.setCurrentPassword(event.target.value)}
					required
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='new-login'>{t('profile.newLogin')}</Label>
				<Input
					id='new-login'
					type='text'
					value={form.newLogin}
					onChange={event => form.setNewLogin(event.target.value)}
					minLength={3}
					maxLength={50}
					placeholder={t('profile.newLoginHint')}
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='new-password'>{t('newPassword')}</Label>
				<Input
					id='new-password'
					type='password'
					value={form.newPassword}
					onChange={event => form.setNewPassword(event.target.value)}
					minLength={8}
					placeholder={t('profile.newPasswordHint')}
				/>
			</div>
			{form.isSuccess ? <p className='text-xs text-status-ok-fg'>{t('profile.credentialsUpdated')}</p> : null}
			{form.isError ? <p className='text-xs text-destructive'>{t('profile.credentialsError')}</p> : null}
			<Button type='submit' disabled={form.isDisabled} className='w-fit bg-docassist-primary text-white'>
				{form.isPending ? t('profile.saving') : t('profile.saveCredentials')}
			</Button>
		</form>
	);
};
