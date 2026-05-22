import React from 'react';

import { usePasswordForm } from '../hooks/use-password-form';

export const PasswordChangeForm: React.FC = () => {
	const form = usePasswordForm();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		form.submit();
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Текущий пароль</label>
				<input
					type='password'
					value={form.current}
					onChange={e => form.setCurrent(e.target.value)}
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Новый пароль</label>
				<input
					type='password'
					value={form.next}
					onChange={e => form.setNext(e.target.value)}
					minLength={8}
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			{form.success && <p className='text-xs text-green-600'>Пароль изменён</p>}
			{form.error && <p className='text-xs text-red-500'>{form.error}</p>}
			<button
				type='submit'
				disabled={form.isDisabled}
				className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
			>
				{form.isPending ? 'Сохранение…' : 'Изменить пароль'}
			</button>
		</form>
	);
};
