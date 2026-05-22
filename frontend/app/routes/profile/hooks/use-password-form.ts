import { useState } from 'react';

import { api } from '@shared/api/client';

export function usePasswordForm() {
	const [current, setCurrent] = useState('');
	const [next, setNext] = useState('');
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	async function submit() {
		setError(null);
		setSuccess(false);
		setIsPending(true);

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
			setIsPending(false);
		}
	}

	return {
		current,
		next,
		success,
		error,
		isPending,
		isDisabled: isPending || !current || !next,
		setCurrent,
		setNext,
		submit,
	};
}
