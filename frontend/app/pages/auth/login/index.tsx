import { HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { LoginForm } from '@features/auth/login-form';
export default function LoginPage() {
	const { t } = useTranslation('common');

	return (
		<main className='min-h-screen bg-muted/40 px-4 py-6'>
			<div className='mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col'>
				<header className='flex items-center justify-between gap-4 py-2'>
					<div className='flex items-center gap-2'>
						<div className='flex size-8 items-center justify-center rounded-lg bg-docassist-primary/10'>
							<HeartPulse size={17} className='text-docassist-primary' />
						</div>
						<div>
							<p className='text-sm font-semibold text-docassist-primary'>{t('brand')}</p>
							<p className='text-[11px] text-muted-foreground'>{t('clinicalMonitoring')}</p>
						</div>
					</div>
				</header>

				<section
					className='mx-auto grid w-full max-w-[420px] flex-1 content-center gap-5 py-10'
					aria-labelledby='login-title'
				>
					<div>
						<h1 id='login-title' className='text-2xl font-semibold tracking-tight'>
							{t('login.title')}
						</h1>
						<p className='mt-1 text-sm text-muted-foreground'>{t('login.hint')}</p>
					</div>
					<LoginForm />
					<p className='text-center text-sm text-muted-foreground'>
						{t('login.noDoctorAccount')}{' '}
						<Link to='/register' className='font-medium text-docassist-primary hover:text-docassist-primary-hover'>
							{t('auth.cta.register')}
						</Link>
					</p>
				</section>
			</div>
		</main>
	);
}
