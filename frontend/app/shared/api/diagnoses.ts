import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type DiagnosisCreate = components['schemas']['DiagnosisCreate'];
type DiagnosisUpdate = components['schemas']['DiagnosisUpdate'];

export const diagnosisQueryKeys = {
	list: (patientId: string) => ['diagnoses', patientId] as const,
};

export function useDiagnoses(patientId: string) {
	return useQuery({
		queryKey: diagnosisQueryKeys.list(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/diagnoses', {
				params: { path: { patient_id: patientId } },
			}),
	});
}

export function useCreateDiagnosisMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: DiagnosisCreate) =>
			api.post('/api/v1/doctor/patients/{patient_id}/diagnoses', {
				body: data,
				params: { path: { patient_id: patientId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: diagnosisQueryKeys.list(patientId) });
		},
	});
}

export function useUpdateDiagnosisMutation(patientId: string, diagnosisId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: DiagnosisUpdate) =>
			api.patch('/api/v1/doctor/patients/{patient_id}/diagnoses/{diagnosis_id}', {
				body: data,
				params: { path: { patient_id: patientId, diagnosis_id: diagnosisId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: diagnosisQueryKeys.list(patientId) });
		},
	});
}
