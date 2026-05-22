import { useState } from 'react';
import { Bell } from 'lucide-react';

import { usePatientMe, useUpdateEmailMutation } from '@shared/api/patient-me';
import { api } from '@shared/api/client';

export function meta() {
	return [{ title: 'Профиль — PsychTrack' }];
}

function EmailBindForm({ currentEmail }: { currentEmail: string | null }) {
	const [email, setEmail] = useState(currentEmail ?? '');
	const [success, setSuccess] = useState(false);
	const mutation = useUpdateEmailMutation();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;
		mutation.mutate(email, { onSuccess: () => setSuccess(true) });
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Email</label>
				<input
					type='email'
					value={email}
					onChange={e => {
						setEmail(e.target.value);
						setSuccess(false);
					}}
					placeholder='you@example.com'
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			{success && <p className='text-xs text-green-600'>Email сохранён</p>}
			{mutation.isError && <p className='text-xs text-red-500'>Ошибка. Попробуйте снова.</p>}
			<button
				type='submit'
				disabled={mutation.isPending || !email || email === currentEmail}
				className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
			>
				{mutation.isPending ? 'Сохранение…' : 'Сохранить email'}
			</button>
		</form>
	);
}

function PasswordChangeForm() {
	const [current, setCurrent] = useState('');
	const [next, setNext] = useState('');
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setPending(true);
		try {
			await api.patch('/api/v1/public/auth/me/password', {
				body: { current_password: current, new_password: next },
			});
			setSuccess(true);
			setCurrent('');
			setNext('');
		} catch {
			setError('Ошибка. Проверьте текущий пароль.');
		} finally {
			setPending(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Текущий пароль</label>
				<input
					type='password'
					value={current}
					onChange={e => setCurrent(e.target.value)}
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Новый пароль</label>
				<input
					type='password'
					value={next}
					onChange={e => setNext(e.target.value)}
					minLength={8}
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			{success && <p className='text-xs text-green-600'>Пароль изменён</p>}
			{error && <p className='text-xs text-red-500'>{error}</p>}
			<button
				type='submit'
				disabled={pending || !current || !next}
				className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
			>
				{pending ? 'Сохранение…' : 'Изменить пароль'}
			</button>
		</form>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className='bg-white border border-border rounded-xl p-5 space-y-3'>
			<h2 className='text-sm font-semibold'>{title}</h2>
			{children}
		</div>
	);
}

export default function ProfileRoute() {
	const { data: me, isLoading } = usePatientMe();

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 space-y-4 max-w-lg'>
			<div>
				<h1 className='text-lg font-semibold'>Профиль</h1>
				{me && (
					<p className='text-sm text-muted-foreground'>
						{me.full_name} · Врач: {me.doctor_full_name}
					</p>
				)}
			</div>

			<Section title='Email'>
				<EmailBindForm currentEmail={me?.email ?? null} />
			</Section>

			<Section title='Пароль'>
				<PasswordChangeForm />
			</Section>

			<Section title='Уведомления'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Bell size={16} className='text-muted-foreground' />
						<span className='text-sm'>Push-уведомления</span>
					</div>
					<span className='text-xs text-muted-foreground italic'>Скоро</span>
				</div>
			</Section>
		</div>
	);
}
