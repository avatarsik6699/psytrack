// Unified routing hook — wraps all React Router primitives into a single object.
// See docs/FRONTEND_CONVENTIONS.md § 5.1 useRouter.
//
// RULE: Never import useParams, useNavigate, useLocation, or useMatches directly.
//       Always use this hook instead.

import { useLocation, useMatches, useNavigate, useParams } from 'react-router';

export namespace RouterTypes {
	export type NavigateOptions = {
		replace?: boolean;
		state?: unknown;
	};

	export type Router = {
		/** All dynamic route params for the current URL, e.g. `router.params.patientScaleId` */
		params: Readonly<Record<string, string | undefined>>;
		/** Current location object (pathname, search, hash, state, key) */
		location: ReturnType<typeof useLocation>;
		/** Route matches for the current location */
		matches: ReturnType<typeof useMatches>;
		/** Navigate programmatically */
		navigate: (to: string, options?: NavigateOptions) => void;
	};
}

export function useRouter(): RouterTypes.Router {
	const params = useParams();
	const location = useLocation();
	const matches = useMatches();
	const navigate = useNavigate();

	return {
		params,
		location,
		matches,
		navigate,
	};
}
