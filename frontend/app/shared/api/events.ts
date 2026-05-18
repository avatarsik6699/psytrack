import { useQuery } from '@tanstack/react-query';

import { api } from '@shared/api/client';

export const eventQueryKeys = {
	timeline: (patientId: string, page: number) => ['events', 'timeline', patientId, page] as const,
};

export function usePatientEvents(patientId: string, page = 1, size = 20) {
	return useQuery({
		queryKey: eventQueryKeys.timeline(patientId, page),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/events', {
				params: { path: { patient_id: patientId } },
				query: { page, size },
			}),
		enabled: !!patientId,
	});
}
