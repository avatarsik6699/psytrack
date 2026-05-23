import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { usePasswordForm } from '../hooks/use-password-form';

export const PasswordChangeForm: React.FC = () => {
	const { t } = useTranslation('common');
	const form = usePasswordForm();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		form.submit();
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div className='space-y-1.5'>
				<Label>{t('passwordForm.currentPassword')}</Label>
				<Input
					type='password'
					value={form.current}
					onChange={e => form.setCurrent(e.target.value)}
				/>
			</div>
			<div className='space-y-1.5'>
				<Label>{t('passwordForm.newPassword')}</Label>
				<Input
					type='password'
					value={form.next}
					onChange={e => form.setNext(e.target.value)}
					minLength={8}
				/>
			</div>
			{form.success && <p className='text-xs text-status-ok-fg'>{t('passwordForm.success')}</p>}
			{form.error && <p className='text-xs text-destructive'>{t('passwordForm.error')}</p>}
			<Button type='submit' disabled={form.isDisabled} className='bg-docassist-primary text-white'>
				{form.isPending ? t('passwordForm.submitting') : t('passwordForm.submit')}
			</Button>
		</form>
	);
};
