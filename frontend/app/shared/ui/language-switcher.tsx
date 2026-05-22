import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

const languages = [
	{ code: 'en', label: 'EN' },
	{ code: 'ru', label: 'RU' },
] as const;

export const LanguageSwitcher: React.FC = () => {
	const i18nHook = useTranslation('common');

	return (
		<div className='flex items-center gap-2'>
			<span className='text-xs text-muted-foreground'>{i18nHook.t('language')}</span>
			<div className='inline-flex rounded-lg border border-border bg-background p-1'>
				{languages.map(language => (
					<Button
						key={language.code}
						type='button'
						size='xs'
						variant={i18nHook.i18n.resolvedLanguage === language.code ? 'default' : 'ghost'}
						onClick={() => void i18nHook.i18n.changeLanguage(language.code)}
					>
						{language.label}
					</Button>
				))}
			</div>
		</div>
	);
};
