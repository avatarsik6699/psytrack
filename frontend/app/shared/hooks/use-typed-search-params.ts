// Typed search-params hook — wraps React Router's useSearchParams with zod validation.
// See docs/FRONTEND_CONVENTIONS.md § 5.2 useTypedSearchParams.
//
// RULE: Never use the raw useSearchParams from 'react-router' directly.
//       Always use this hook, passing a zod schema that describes the valid params.

import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { z } from 'zod';

export namespace TypedSearchParamsTypes {
	export type Schema = z.ZodObject<z.ZodRawShape>;

	export type Inferred<S extends Schema> = z.infer<S>;

	export type Api<S extends Schema> = {
		/** Parse and validate the current URL search params against the schema. */
		get<K extends keyof Inferred<S>>(key: K): Inferred<S>[K];
		/** Set one param (navigates to updated URL). */
		set<K extends keyof Inferred<S>>(key: K, value: Inferred<S>[K]): void;
		/** Remove a param from the URL. */
		remove(key: string): void;
		/** Check whether a param key is present in the current URL. */
		has(key: string): boolean;
		/** Add a param without removing existing ones with the same key. */
		add<K extends keyof Inferred<S>>(key: K, value: string): void;
		/** Return the raw URLSearchParams instance. */
		raw: URLSearchParams;
	};
}

/**
 * Usage:
 * ```ts
 * const schema = z.object({ tab: z.enum(['overview', 'history']).default('overview') });
 * const searchParams = useTypedSearchParams(schema);
 * searchParams.get('tab');          // 'overview' | 'history'
 * searchParams.set('tab', 'history');
 * searchParams.remove('tab');
 * ```
 */
export function useTypedSearchParams<S extends TypedSearchParamsTypes.Schema>(
	schema: S
): TypedSearchParamsTypes.Api<S> {
	const [rawParams, setSearchParams] = useSearchParams();

	const parsed = useCallback(
		function parseFx(): TypedSearchParamsTypes.Inferred<S> {
			const raw: Record<string, string> = {};
			rawParams.forEach((value, key) => {
				raw[key] = value;
			});
			const result = schema.safeParse(raw);
			// Fall back to schema defaults when params are invalid/missing.
			return result.success ? result.data : (schema.parse({}) as TypedSearchParamsTypes.Inferred<S>);
		},
		[rawParams, schema]
	);

	const get = useCallback(
		function getFx<K extends keyof TypedSearchParamsTypes.Inferred<S>>(key: K): TypedSearchParamsTypes.Inferred<S>[K] {
			return parsed()[key];
		},
		[parsed]
	);

	const set = useCallback(
		function setFx<K extends keyof TypedSearchParamsTypes.Inferred<S>>(
			key: K,
			value: TypedSearchParamsTypes.Inferred<S>[K]
		): void {
			setSearchParams(function updaterFx(prev) {
				const next = new URLSearchParams(prev);
				next.set(String(key), String(value));
				return next;
			});
		},
		[setSearchParams]
	);

	const remove = useCallback(
		function removeFx(key: string): void {
			setSearchParams(function updaterFx(prev) {
				const next = new URLSearchParams(prev);
				next.delete(key);
				return next;
			});
		},
		[setSearchParams]
	);

	const has = useCallback(
		function hasFx(key: string): boolean {
			return rawParams.has(key);
		},
		[rawParams]
	);

	const add = useCallback(
		function addFx<K extends keyof TypedSearchParamsTypes.Inferred<S>>(key: K, value: string): void {
			setSearchParams(function updaterFx(prev) {
				const next = new URLSearchParams(prev);
				next.append(String(key), value);
				return next;
			});
		},
		[setSearchParams]
	);

	return {
		get,
		set,
		remove,
		has,
		add,
		raw: rawParams,
	};
}
