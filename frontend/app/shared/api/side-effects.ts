import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientSideEffectIn = components['schemas']['PatientSideEffectIn'];
type PatientSideEffectUpdate = components['schemas']['PatientSideEffectUpdate'];
type SeMonitoringRuleIn = components['schemas']['SeMonitoringRuleIn'];

export const seQueryKeys = {
	dict: (q?: string, bodySystem?: string) => ['se', 'dict', q ?? '', bodySystem ?? ''] as const,
	mySideEffects: () => ['se', 'my'] as const,
	chart: (patientId: string) => ['se', 'chart', patientId] as const,
};

export function useSeDictionary(q: string, bodySystem?: string) {
	return useQuery({
		queryKey: seQueryKeys.dict(q, bodySystem),
		queryFn: () =>
			api.get('/api/v1/ref/se-dictionary', {
				query: { q: q || undefined, body_system: bodySystem || undefined, size: 50 },
			}),
		enabled: true,
	});
}

export function useMySideEffects() {
	return useQuery({
		queryKey: seQueryKeys.mySideEffects(),
		queryFn: () => api.get('/api/v1/patient/side-effects'),
	});
}

export function useReportSideEffectMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientSideEffectIn) =>
			api.post('/api/v1/patient/side-effects', { body: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: seQueryKeys.mySideEffects() });
		},
	});
}

export function useUpdateSideEffectMutation(seRecordId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientSideEffectUpdate) =>
			api.patch('/api/v1/patient/side-effects/{se_record_id}', {
				body: data,
				params: { path: { se_record_id: seRecordId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: seQueryKeys.mySideEffects() });
		},
	});
}

export function useDeleteSideEffectMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (seRecordId: string) =>
			api.delete('/api/v1/patient/side-effects/{se_record_id}', {
				params: { path: { se_record_id: seRecordId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: seQueryKeys.mySideEffects() });
		},
	});
}

export function useAddSeRuleMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: SeMonitoringRuleIn) =>
			api.post('/api/v1/doctor/patients/{patient_id}/se-rules', {
				body: data,
				params: { path: { patient_id: patientId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['se', 'rules', patientId] });
		},
	});
}

export function useDeleteSeRuleMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ruleId: string) =>
			api.delete('/api/v1/doctor/patients/{patient_id}/se-rules/{rule_id}', {
				params: { path: { patient_id: patientId, rule_id: ruleId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['se', 'rules', patientId] });
		},
	});
}

export function useSeChart(patientId: string) {
	return useQuery({
		queryKey: seQueryKeys.chart(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/charts/side-effects', {
				params: { path: { patient_id: patientId } },
			}),
		enabled: !!patientId,
	});
}
