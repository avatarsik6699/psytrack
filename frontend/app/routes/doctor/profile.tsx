import React from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentSession, useSessionSummary } from '@shared/api/auth';
import { LanguageSwitcher } from '@shared/ui/language-switcher';
import { ThemeToggle } from '@shared/ui/theme-toggle';

import { Button } from '@/components/ui/button';

export function meta() {
	return [{ title: 'Профиль врача — PsychTrack' }];
}

const DoctorProfileRoute: React.FC = () => {
	const { t } = useTranslation('common');
	const sessionQuery = useCurrentSession();
	const { accessToken } = useSessionSummary();
	const session = sessionQuery.data;
	const tokenPreview = accessToken ? `${accessToken.slice(0, 18)}...${accessToken.slice(-10)}` : t('session.noToken');

	return (
		<div className='mx-auto max-w-5xl space-y-5 p-4 md:p-6'>
			<div>
				<h1 className='text-xl font-semibold'>{t('profile.doctorTitle')}</h1>
				<p className='text-sm text-muted-foreground'>{t('profile.doctorSubtitle')}</p>
			</div>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]'>
				<section className='rounded-xl border border-border bg-card p-5 text-card-foreground'>
					<p className='text-xs uppercase text-muted-foreground'>{t('roles.doctor')}</p>
					<h2 className='mt-1 text-lg font-semibold'>{session?.display_name ?? t('loading')}</h2>
					<p className='text-sm text-muted-foreground'>{session?.specialty ?? t('profile.specialtyEmpty')}</p>
					<p className='mt-4 text-xs text-muted-foreground'>{session?.email}</p>
				</section>

				<section className='rounded-xl border border-border bg-card p-5 text-card-foreground'>
					<h2 className='text-sm font-semibold'>{t('profile.interface')}</h2>
					<div className='mt-4 grid gap-3'>
						<LanguageSwitcher />
						<ThemeToggle />
					</div>
				</section>

				<section className='rounded-xl border border-border bg-card p-5 text-card-foreground'>
					<h2 className='text-sm font-semibold'>{t('session.title')}</h2>
					<table className='mt-3 w-full text-sm'>
						<tbody>
							<tr className='border-b border-border'>
								<td className='py-2 text-xs text-muted-foreground'>{t('session.role')}</td>
								<td className='py-2 text-right'>{t('roles.doctor')}</td>
							</tr>
							<tr className='border-b border-border'>
								<td className='py-2 text-xs text-muted-foreground'>{t('session.profileId')}</td>
								<td className='py-2 text-right font-mono text-xs'>{session?.doctor_id ?? '...'}</td>
							</tr>
							<tr>
								<td className='py-2 text-xs text-muted-foreground'>{t('session.userId')}</td>
								<td className='py-2 text-right font-mono text-xs'>{session?.user_id ?? '...'}</td>
							</tr>
						</tbody>
					</table>
				</section>

				<section className='rounded-xl border border-border bg-card p-5 text-card-foreground'>
					<h2 className='text-sm font-semibold'>{t('session.accessToken')}</h2>
					<p className='mt-3 break-all rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs'>{tokenPreview}</p>
					<Button
						type='button'
						variant='outline'
						className='mt-3'
						disabled={!accessToken}
						onClick={() => accessToken && navigator.clipboard.writeText(accessToken)}
					>
						{t('actions.copy')}
					</Button>
				</section>
			</div>
		</div>
	);
};

export default DoctorProfileRoute;
