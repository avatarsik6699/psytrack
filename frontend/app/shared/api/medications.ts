import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientMedicationCreate = components['schemas']['PatientMedicationCreate'];
type PatientMedicationUpdate = components['schemas']['PatientMedicationUpdate'];

export const medicationQueryKeys = {
	ref: (q?: string) => ['medications', 'ref', q ?? ''] as const,
	patientMeds: (patientId: string) => ['medications', 'patient', patientId] as const,
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
