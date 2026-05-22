import React from 'react';

import { useEmailForm } from '../hooks/use-email-form';

type Props = {
	currentEmail: string | null;
};

export const EmailBindForm: React.FC<Props> = props => {
	const form = useEmailForm({ currentEmail: props.currentEmail });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		form.submit();
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div>
				<label className='text-xs text-muted-foreground block mb-1'>Email</label>
				<input
					type='email'
					value={form.email}
					onChange={e => form.changeEmail(e.target.value)}
					placeholder='you@example.com'
					className='w-full border border-input rounded-md px-3 py-2 text-sm'
				/>
			</div>
			{form.success && <p className='text-xs text-green-600'>Email сохранён</p>}
			{form.isError && <p className='text-xs text-red-500'>Ошибка. Попробуйте снова.</p>}
			<button
				type='submit'
				disabled={form.isDisabled}
				className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
			>
				{form.isPending ? 'Сохранение…' : 'Сохранить email'}
			</button>
		</form>
	);
};
