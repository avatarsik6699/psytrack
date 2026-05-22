import { Bell } from 'lucide-react';
import React from 'react';

import { usePatientMe } from '@shared/api/patient-me';

import { EmailBindForm } from './components/email-bind-form';
import { PasswordChangeForm } from './components/password-change-form';
import { ProfileSection } from './components/profile-section';

export function meta() {
	return [{ title: 'Профиль — PsychTrack' }];
}

const ProfileRoute: React.FC = () => {
	const meQuery = usePatientMe();

	if (meQuery.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	return (
		<div className='p-6 space-y-4 max-w-lg'>
			<div>
				<h1 className='text-lg font-semibold'>Профиль</h1>
				{meQuery.data && (
					<p className='text-sm text-muted-foreground'>
						{meQuery.data.full_name} · Врач: {meQuery.data.doctor_full_name}
					</p>
				)}
			</div>

			<ProfileSection title='Email'>
				<EmailBindForm currentEmail={meQuery.data?.email ?? null} />
			</ProfileSection>

			<ProfileSection title='Пароль'>
				<PasswordChangeForm />
			</ProfileSection>

			<ProfileSection title='Уведомления'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Bell size={16} className='text-muted-foreground' />
						<span className='text-sm'>Push-уведомления</span>
					</div>
					<span className='text-xs text-muted-foreground italic'>Скоро</span>
				</div>
			</ProfileSection>
		</div>
	);
};

export default ProfileRoute;
