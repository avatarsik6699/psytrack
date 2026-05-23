import { HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { RegisterForm } from '@features/auth/register-form';
export default function RegisterPage() {
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
							<p className='text-[11px] text-muted-foreground'>{t('doctorOffice')}</p>
						</div>
					</div>
				</header>

				<section
					className='mx-auto grid w-full max-w-[460px] flex-1 content-center gap-5 py-10'
					aria-labelledby='register-title'
				>
					<div>
						<h1 id='register-title' className='text-2xl font-semibold tracking-tight'>
							{t('register.title')}
						</h1>
						<p className='mt-1 text-sm text-muted-foreground'>{t('register.hint')}</p>
					</div>
					<RegisterForm />
					<p className='text-center text-sm text-muted-foreground'>
						{t('register.hasAccount')}{' '}
						<Link to='/login' className='font-medium text-docassist-primary hover:text-docassist-primary-hover'>
							{t('auth.cta.signIn')}
						</Link>
					</p>
				</section>
			</div>
		</main>
	);
}
