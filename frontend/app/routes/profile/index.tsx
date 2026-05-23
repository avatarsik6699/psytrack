import { Bell, UserRound } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { usePatientMe } from '@shared/api/patient-me';
import { LanguageSwitcher } from '@shared/ui/language-switcher';
import { ThemeToggle } from '@shared/ui/theme-toggle';

import { PatientCredentialForm } from './components/patient-credential-form';
import { ProfileSection } from './components/profile-section';
import { SessionInfoPanel } from './components/session-info-panel';

export function meta() {
	return [{ title: 'Профиль — PsychTrack' }];
}

const ProfileRoute: React.FC = () => {
	const { t } = useTranslation('common');
	const meQuery = usePatientMe();

	if (meQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>{t('loading')}</div>;
	}

	return (
		<div className='mx-auto max-w-5xl space-y-5 p-4 md:p-6'>
			<div>
				<h1 className='text-xl font-semibold'>{t('profile.title')}</h1>
				<p className='text-sm text-muted-foreground'>{t('profile.patientSubtitle')}</p>
			</div>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]'>
				<div className='space-y-4'>
					<ProfileSection title={t('profile.patientData')}>
						<div className='flex items-center gap-3'>
							<div className='flex size-11 items-center justify-center rounded-full bg-docassist-primary/10 text-docassist-primary'>
								<UserRound size={20} />
							</div>
							<div className='min-w-0'>
								<p className='font-medium'>{meQuery.data?.full_name ?? t('roles.patient')}</p>
								<p className='text-sm text-muted-foreground'>
									{meQuery.data?.doctor_specialty
										? `${meQuery.data.doctor_full_name} · ${meQuery.data.doctor_specialty}`
										: meQuery.data?.doctor_full_name}
								</p>
							</div>
						</div>
					</ProfileSection>

					<ProfileSection title={t('profile.loginPassword')}>
						<PatientCredentialForm currentLogin={meQuery.data?.temp_login} />
					</ProfileSection>

					<ProfileSection title={t('profile.interface')}>
						<div className='grid gap-3'>
							<LanguageSwitcher />
							<ThemeToggle />
						</div>
					</ProfileSection>

					<ProfileSection title={t('profile.notifications')}>
						<div className='flex items-center justify-between gap-3'>
							<div className='flex items-center gap-2'>
								<Bell size={16} className='text-muted-foreground' />
								<span className='text-sm'>{t('profile.inAppReminders')}</span>
							</div>
							<span className='text-xs text-muted-foreground'>{t('profile.inDevelopment')}</span>
						</div>
					</ProfileSection>
				</div>
				<ProfileSection title={t('session.title')}>
					<SessionInfoPanel />
				</ProfileSection>
			</div>
		</div>
	);
};

export default ProfileRoute;
