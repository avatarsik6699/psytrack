import { useQuery } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

export type ScoreChartSeries = components['schemas']['ScoreChartSeries'];

export const chartQueryKeys = {
	scores: (patientId: string) => ['charts', 'scores', patientId] as const,
};

export function useScoreChart(patientId: string) {
	return useQuery({
		queryKey: chartQueryKeys.scores(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/charts/scores', {
				params: { path: { patient_id: patientId } },
			}),
		enabled: !!patientId,
	});
}
