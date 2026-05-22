import { useState } from 'react';

import { useUpdateEmailMutation } from '@shared/api/patient-me';

type Params = {
	currentEmail: string | null;
};

export function useEmailForm(params: Params) {
	const [email, setEmail] = useState(params.currentEmail ?? '');
	const [success, setSuccess] = useState(false);
	const mutation = useUpdateEmailMutation();

	function submit() {
		if (!email) {
			return;
		}

		mutation.mutate(email, {
			onSuccess: function onSuccessFx() {
				setSuccess(true);
			},
		});
	}

	function changeEmail(value: string) {
		setEmail(value);
		setSuccess(false);
	}

	return {
		email,
		success,
		isPending: mutation.isPending,
		isError: mutation.isError,
		isDisabled: mutation.isPending || !email || email === params.currentEmail,
		changeEmail,
		submit,
	};
}
