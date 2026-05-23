import { useTheme } from 'next-themes';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

const themes = ['light', 'dark', 'system'] as const;

type Props = {
	compact?: boolean;
};

export const ThemeToggle: React.FC<Props> = props => {
	const themeHook = useTheme();
	const i18nHook = useTranslation('common');

	return (
		<div className='flex items-center gap-2'>
			{props.compact ? null : <span className='text-xs text-muted-foreground'>{i18nHook.t('theme')}</span>}
			<div className='inline-flex rounded-lg border border-border bg-background p-1'>
				{themes.map(value => (
					<Button
						key={value}
						type='button'
						size='xs'
						variant={themeHook.theme === value ? 'default' : 'ghost'}
						onClick={() => themeHook.setTheme(value)}
						className='capitalize'
					>
						{i18nHook.t(value)}
					</Button>
				))}
			</div>
		</div>
	);
};
