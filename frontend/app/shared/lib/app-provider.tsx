import { ThemeProvider } from 'next-themes';
import { type PropsWithChildren, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@shared/lib/i18n';
import { I18NEXT_LANGUAGE_STORAGE } from '@shared/lib/i18n-storage';
import { QueryProvider } from '@shared/lib/query-provider';
import { safeLs } from '@shared/lib/safe-ls';

export function AppProvider({ children }: PropsWithChildren) {
	useEffect(function syncSavedLanguageFx() {
		const saved = safeLs.get(I18NEXT_LANGUAGE_STORAGE);
		if (saved && saved !== i18n.language) {
			void i18n.changeLanguage(saved);
		}
	}, []);

	return (
		<ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
			<I18nextProvider i18n={i18n}>
				<QueryProvider>{children}</QueryProvider>
			</I18nextProvider>
		</ThemeProvider>
	);
}
