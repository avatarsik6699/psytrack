import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientCreate = components['schemas']['PatientCreate'];
type PatientUpdate = components['schemas']['PatientUpdate'];

export const patientQueryKeys = {
	list: ['patients'] as const,
	detail: (id: string) => ['patients', id] as const,
};

export function usePatients() {
	return useQuery({
		queryKey: patientQueryKeys.list,
		queryFn: () => api.get('/api/v1/doctor/patients'),
	});
}

export function usePatient(id: string) {
	return useQuery({
		queryKey: patientQueryKeys.detail(id),
		queryFn: () => api.get('/api/v1/doctor/patients/{patient_id}', { params: { path: { patient_id: id } } }),
	});
}

export function useCreatePatientMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientCreate) => api.post('/api/v1/doctor/patients', { body: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientQueryKeys.list });
		},
	});
}

export function useUpdatePatientMutation(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientUpdate) =>
			api.patch('/api/v1/doctor/patients/{patient_id}', {
				body: data,
				params: { path: { patient_id: id } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientQueryKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: patientQueryKeys.list });
		},
	});
}

export function useArchivePatientMutation(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () =>
			api.post('/api/v1/doctor/patients/{patient_id}/archive', {
				params: { path: { patient_id: id } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientQueryKeys.list });
		},
	});
}

export function useResetPatientCredentialsMutation(patientId: string) {
	return useMutation({
		mutationFn: () =>
			api.post('/api/v1/doctor/patients/{patient_id}/credentials/reset', {
				params: { path: { patient_id: patientId } },
			}),
	});
}
