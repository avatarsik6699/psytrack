import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientScaleCreate = components['schemas']['PatientScaleCreate'];
type TestSubmitIn = components['schemas']['TestSubmitIn'];

export const scalesQueryKeys = {
	refScales: () => ['scales', 'ref'] as const,
	scaleQuestions: (scaleId: string) => ['scales', 'questions', scaleId] as const,
	patientScales: (patientId: string) => ['scales', 'patient', patientId] as const,
	patientScale: (psId: string) => ['scales', 'patientScale', psId] as const,
	history: () => ['scales', 'history'] as const,
};

export function useScales() {
	return useQuery({
		queryKey: scalesQueryKeys.refScales(),
		queryFn: () => api.get('/api/v1/ref/scales'),
	});
}

export function useScaleQuestions(scaleId: string) {
	return useQuery({
		queryKey: scalesQueryKeys.scaleQuestions(scaleId),
		queryFn: () =>
			api.get('/api/v1/ref/scales/{scale_id}/questions', {
				params: { path: { scale_id: scaleId } },
			}),
		enabled: !!scaleId,
	});
}

export function usePatientScales(patientId: string) {
	return useQuery({
		queryKey: scalesQueryKeys.patientScales(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/scales', {
				params: { path: { patient_id: patientId } },
			}),
		enabled: !!patientId,
	});
}

export function useMyAssignedScales() {
	return useQuery({
		queryKey: ['scales', 'my-assigned'] as const,
		queryFn: () => api.get('/api/v1/patient/scales'),
	});
}

export function useAssignScaleMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientScaleCreate) =>
			api.post('/api/v1/doctor/patients/{patient_id}/scales', {
				body: data,
				params: { path: { patient_id: patientId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scalesQueryKeys.patientScales(patientId) });
		},
	});
}

export function useDeleteScaleMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (patientScaleId: string) =>
			api.delete('/api/v1/doctor/patients/{patient_id}/scales/{patient_scale_id}', {
				params: { path: { patient_id: patientId, patient_scale_id: patientScaleId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scalesQueryKeys.patientScales(patientId) });
		},
	});
}

export function useSubmitTestMutation(patientScaleId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: TestSubmitIn) =>
			api.post('/api/v1/patient/tests/{patient_scale_id}/submit', {
				body: data,
				params: { path: { patient_scale_id: patientScaleId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scalesQueryKeys.history() });
		},
	});
}

export function useTestHistory(limit = 20, offset = 0) {
	return useQuery({
		queryKey: scalesQueryKeys.history(),
		queryFn: () => api.get('/api/v1/patient/history', { query: { limit, offset } }),
	});
}

export function usePatientScale(patientScaleId: string) {
	return useQuery({
		queryKey: scalesQueryKeys.patientScale(patientScaleId),
		queryFn: () =>
			api.get('/api/v1/patient/scales/{patient_scale_id}', {
				params: { path: { patient_scale_id: patientScaleId } },
			}),
		enabled: !!patientScaleId,
	});
}
