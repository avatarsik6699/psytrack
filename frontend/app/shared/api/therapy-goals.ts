import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

export type TherapyGoalOut = components['schemas']['TherapyGoalOut'];

export const goalQueryKeys = {
	list: (patientId: string) => ['therapy-goals', patientId] as const,
};

export function useTherapyGoals(patientId: string) {
	return useQuery({
		queryKey: goalQueryKeys.list(patientId),
		queryFn: () =>
			api.get('/api/v1/doctor/patients/{patient_id}/goals', {
				params: { path: { patient_id: patientId } },
			}),
		enabled: !!patientId,
	});
}

export function useCreateGoalMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (description: string) =>
			api.post('/api/v1/doctor/patients/{patient_id}/goals', {
				params: { path: { patient_id: patientId } },
				body: { description },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: goalQueryKeys.list(patientId) });
		},
	});
}

export function useToggleGoalMutation(patientId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ goalId, isCompleted }: { goalId: string; isCompleted: boolean }) =>
			api.patch('/api/v1/doctor/patients/{patient_id}/goals/{goal_id}', {
				params: { path: { patient_id: patientId, goal_id: goalId } },
				body: { is_completed: isCompleted },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: goalQueryKeys.list(patientId) });
		},
	});
}
