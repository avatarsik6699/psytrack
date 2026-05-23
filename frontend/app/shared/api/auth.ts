import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

export function useAuthToken() {
	const queryClient = useQueryClient();

	return useQuery<TokenPair | null>({
		queryKey: authQueryKeys.token,
		queryFn: async () => jwtService.read(),
		initialData: () => queryClient.getQueryData<TokenPair | null>(authQueryKeys.token) ?? jwtService.read(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}

export function useMe() {
	const { data: token } = useAuthToken();

	return useQuery({
		queryKey: authQueryKeys.me,
		enabled: Boolean(token?.access_token),
		queryFn: () => api.get('/api/v1/public/auth/me'),
	});
}

export function useCurrentSession() {
	const { data: token } = useAuthToken();

	return useQuery({
		queryKey: authQueryKeys.session,
		enabled: Boolean(token?.access_token),
		queryFn: () => api.get('/api/v1/public/auth/session'),
	});
}

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['LoginRequest']) =>
			api.post('/api/v1/public/auth/login', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['RegisterRequest']) =>
			api.post('/api/v1/public/auth/register', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

export function usePatientLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['PatientTempLoginRequest']) =>
			api.post('/api/v1/public/auth/patient-login', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

export function useRefreshMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['RefreshRequest']) =>
			api.post('/api/v1/public/auth/refresh', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.post('/api/v1/public/auth/logout', {}),
		onSettled: () => {
			jwtService.set(queryClient, null);
			queryClient.removeQueries({ queryKey: authQueryKeys.me });
			queryClient.removeQueries({ queryKey: authQueryKeys.session });
		},
	});
}

export function useSessionSummary() {
	const tokenQuery = useAuthToken();
	const meQuery = useMe();

	const accessToken = tokenQuery.data?.access_token ?? null;
	const isAuthenticated = Boolean(accessToken);

	return {
		accessToken,
		isAuthenticated,
		tokenQuery,
		meQuery,
	};
}
