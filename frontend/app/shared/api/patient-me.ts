import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import type { components } from '@shared/types/schema';

type PatientCredentialUpdateIn = components['schemas']['PatientCredentialUpdateIn'];

export const patientMeQueryKeys = {
	me: () => ['patient', 'me'] as const,
};

export function usePatientMe() {
	return useQuery({
		queryKey: patientMeQueryKeys.me(),
		queryFn: () => api.get('/api/v1/patient/me'),
	});
}

export function useUpdateEmailMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (email: string) => api.patch('/api/v1/public/auth/me/email', { body: { email } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientMeQueryKeys.me() });
		},
	});
}

export function useUpdatePatientCredentialsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: PatientCredentialUpdateIn) => api.patch('/api/v1/patient/me/credentials', { body }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientMeQueryKeys.me() });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}
