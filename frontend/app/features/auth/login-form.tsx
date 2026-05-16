import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useLoginMutation, useMe, usePatientLoginMutation } from '@shared/api/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
	const { t: tCommon } = useTranslation('common');
	const { t: tErrors } = useTranslation('errors');
	const navigate = useNavigate();
	const { refetch: refetchMe } = useMe();
	const loginMutation = useLoginMutation();
	const patientLoginMutation = usePatientLoginMutation();

	const [mode, setMode] = useState<'doctor' | 'patient'>('doctor');
	const [email, setEmail] = useState('');
	const [tempLogin, setTempLogin] = useState('');
	const [password, setPassword] = useState('');

	const isPending = loginMutation.isPending || patientLoginMutation.isPending;
	const isError = loginMutation.isError || patientLoginMutation.isError;

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (mode === 'doctor') {
			await loginMutation.mutateAsync({ email, password });
		} else {
			await patientLoginMutation.mutateAsync({ temp_login: tempLogin, password });
		}
		const result = await refetchMe();
		navigate(result.data?.role === 'doctor' ? '/doctor' : '/', { replace: true });
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='flex gap-2 text-xs'>
				<button
					type='button'
					onClick={() => setMode('doctor')}
					className={mode === 'doctor' ? 'font-semibold text-docassist-primary' : 'text-muted-foreground'}
				>
					Doctor
				</button>
				<span className='text-muted-foreground'>·</span>
				<button
					type='button'
					onClick={() => setMode('patient')}
					className={mode === 'patient' ? 'font-semibold text-docassist-primary' : 'text-muted-foreground'}
				>
					Patient
				</button>
			</div>

			{mode === 'doctor' ? (
				<div className='grid gap-1.5'>
					<Label htmlFor='email'>{tCommon('email')}</Label>
					<Input
						id='email'
						name='email'
						type='email'
						value={email}
						onChange={event => setEmail(event.target.value)}
						required
					/>
				</div>
			) : (
				<div className='grid gap-1.5'>
					<Label htmlFor='temp_login'>Temporary login</Label>
					<Input
						id='temp_login'
						name='temp_login'
						type='text'
						value={tempLogin}
						onChange={event => setTempLogin(event.target.value)}
						required
					/>
				</div>
			)}

			<div className='grid gap-1.5'>
				<Label htmlFor='password'>{tCommon('password')}</Label>
				<Input
					id='password'
					name='password'
					type='password'
					value={password}
					onChange={event => setPassword(event.target.value)}
					required
				/>
			</div>

			{isError ? <p className='text-sm text-destructive'>{tErrors('unableSignIn')}</p> : null}

			<Button
				type='submit'
				disabled={isPending}
				className='bg-docassist-primary text-white hover:bg-docassist-primary-hover'
			>
				{isPending ? tErrors('signingIn') : tErrors('signIn')}
			</Button>
		</form>
	);
}
