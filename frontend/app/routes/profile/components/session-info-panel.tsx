import React from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentSession, useLogoutMutation } from '@shared/api/auth';

import { Button } from '@/components/ui/button';

export const SessionInfoPanel: React.FC = () => {
	const { t } = useTranslation('common');
	const sessionQuery = useCurrentSession();
	const logoutMutation = useLogoutMutation();
	const session = sessionQuery.data;

	return (
		<div className='space-y-3'>
			<div className='overflow-hidden rounded-lg border border-border'>
				<table className='w-full text-sm'>
					<tbody>
						<tr className='border-b border-border'>
							<td className='w-32 bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>{t('session.role')}</td>
							<td className='px-3 py-2'>{session?.role === 'patient' ? t('roles.patient') : '...'}</td>
						</tr>
						<tr className='border-b border-border'>
							<td className='bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>{t('session.profile')}</td>
							<td className='px-3 py-2'>{session?.display_name ?? t('loading')}</td>
						</tr>
						<tr>
							<td className='bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>{t('session.sessionId')}</td>
							<td className='px-3 py-2 font-mono text-xs'>{session?.user_id ?? '...'}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<Button
				type='button'
				variant='destructive'
				disabled={logoutMutation.isPending}
				onClick={() => logoutMutation.mutate()}
			>
				{t('session.end')}
			</Button>
		</div>
	);
};
