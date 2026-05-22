import { useQuery } from '@tanstack/react-query';

import { api } from '@shared/api/client';

export const taskQueryKeys = {
	myTasks: () => ['tasks', 'my'] as const,
};

export function usePatientTasks() {
	return useQuery({
		queryKey: taskQueryKeys.myTasks(),
		queryFn: () => api.get('/api/v1/patient/tasks'),
	});
}
