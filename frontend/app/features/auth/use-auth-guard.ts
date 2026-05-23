import { useEffect } from 'react';

import { useAuthToken } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';

export function shouldRedirectToLogin(accessToken?: string): boolean {
	return !accessToken;
}

export function useAuthGuard() {
	const { navigate, location } = useRouter();
	const tokenQuery = useAuthToken();

	useEffect(
		function redirectToLoginFx() {
			if (shouldRedirectToLogin(tokenQuery.data?.access_token)) {
				navigate('/login', {
					replace: true,
					state: { from: location.pathname },
				});
			}
		},
		[navigate, location.pathname, tokenQuery.data?.access_token]
	);

	return {
		isAuthenticated: Boolean(tokenQuery.data?.access_token),
	};
}
