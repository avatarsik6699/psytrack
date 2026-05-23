import { type SafeLsTypes } from '@shared/lib/safe-ls';

export const I18NEXT_LANGUAGE_STORAGE = {
	key: 'i18nextLng',
	version: 1,
	guard: (value: unknown): value is string => typeof value === 'string',
} satisfies SafeLsTypes.Key<string>;
