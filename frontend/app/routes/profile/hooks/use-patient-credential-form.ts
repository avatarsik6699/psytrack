import { useState } from 'react';

import { useUpdatePatientCredentialsMutation } from '@shared/api/patient-me';

export function usePatientCredentialForm() {
	const mutation = useUpdatePatientCredentialsMutation();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newLogin, setNewLogin] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [success, setSuccess] = useState(false);

	async function submit() {
		setSuccess(false);
		await mutation.mutateAsync({
			current_password: currentPassword,
			new_login: newLogin.trim() || undefined,
			new_password: newPassword || undefined,
		});
		setCurrentPassword('');
		setNewLogin('');
		setNewPassword('');
		setSuccess(true);
	}

	return {
		currentPassword,
		newLogin,
		newPassword,
		isPending: mutation.isPending,
		isSuccess: success,
		isError: mutation.isError,
		isDisabled: mutation.isPending || !currentPassword || (!newLogin.trim() && !newPassword),
		setCurrentPassword,
		setNewLogin,
		setNewPassword,
		submit,
	};
}
