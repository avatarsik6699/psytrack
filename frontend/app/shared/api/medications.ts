import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientMedicationCreate = components['schemas']['PatientMedicationCreate'];
type PatientMedicationUpdate = components['schemas']['PatientMedicationUpdate'];
type MedicationLogIn = components['schemas']['MedicationLogIn'];

export const medicationQueryKeys = {
	ref: (q?: string) => ['medications', 'ref', q ?? ''] as const,
	patientMeds: (patientId: string) => ['medications', 'patient', patientId] as const,
	myMeds: () => ['medications', 'my'] as const,
	chart: (patientId: string) => ['medications', 'chart', patientId] as const,
};

export function useMedicationSearch(q: string) {
	return useQuery({
		queryKey: medicationQueryKeys.ref(q),
		queryFn: () => api.get('/api/v1/ref/medications', { query: { q } }),
		enabled: q.length >= 2,
	});
}

export function usePatientMedications(patientId: string) {
	return useQuery({
		queryKey: medicationQueryKeys.patientMeds(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/medications', {
				params: { path: { patient_id: patientId } },
			}),
	});
}

export function useAssignMedicationMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientMedicationCreate) =>
			api.post('/api/v1/doctor/patients/{patient_id}/medications', {
				body: data,
				params: { path: { patient_id: patientId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.patientMeds(patientId) });
		},
	});
}

export function useUpdatePatientMedicationMutation(patientId: string, medicationId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientMedicationUpdate) =>
			api.patch('/api/v1/doctor/patients/{patient_id}/medications/{medication_id}', {
				body: data,
				params: { path: { patient_id: patientId, medication_id: medicationId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.patientMeds(patientId) });
		},
	});
}

// --- Patient-side hooks ---

export function useMyMedications() {
	return useQuery({
		queryKey: medicationQueryKeys.myMeds(),
		queryFn: () => api.get('/api/v1/patient/medications'),
	});
}

export function useLogDoseMutation(medicationId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: MedicationLogIn) =>
			api.patch('/api/v1/patient/medications/{medication_id}/log', {
				body: data,
				params: { path: { medication_id: medicationId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.myMeds() });
		},
	});
}

export function useAddMyMedicationMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientMedicationCreate) =>
			api.post('/api/v1/patient/medications', { body: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.myMeds() });
		},
	});
}

export function useEditMyMedicationMutation(medicationId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatientMedicationUpdate) =>
			api.patch('/api/v1/patient/medications/{medication_id}', {
				body: data,
				params: { path: { medication_id: medicationId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.myMeds() });
		},
	});
}

export function useStopMyMedicationMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (medicationId: string) =>
			api.delete('/api/v1/patient/medications/{medication_id}', {
				params: { path: { medication_id: medicationId } },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: medicationQueryKeys.myMeds() });
		},
	});
}

// --- Doctor chart ---

export function useMedicationChart(patientId: string) {
	return useQuery({
		queryKey: medicationQueryKeys.chart(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/charts/medications', {
				params: { path: { patient_id: patientId } },
			}),
		enabled: !!patientId,
	});
}
