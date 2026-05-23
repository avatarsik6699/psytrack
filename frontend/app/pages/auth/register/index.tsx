import { HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { RegisterForm } from '@features/auth/register-form';

export default function RegisterPage() {
	const { t } = useTranslation('common');

	return (
		<main className='flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8'>
			<section className='w-full max-w-115' aria-labelledby='register-title'>
				<div className='mb-6 flex flex-col items-center gap-2'>
					<div className='flex size-10 items-center justify-center rounded-xl bg-docassist-primary/10'>
						<HeartPulse size={20} className='text-docassist-primary' />
					</div>
					<p className='text-sm font-bold text-docassist-primary'>{t('brand')}</p>
				</div>

				<div className='mb-5'>
					<h1 id='register-title' className='text-2xl font-semibold tracking-tight'>
						{t('register.title')}
					</h1>
					<p className='mt-1 text-sm text-muted-foreground'>{t('register.hint')}</p>
				</div>

				<RegisterForm />

				<p className='mt-4 text-center text-sm text-muted-foreground'>
					{t('register.hasAccount')}{' '}
					<Link to='/login' className='font-medium text-docassist-primary hover:text-docassist-primary-hover'>
						{t('auth.cta.signIn')}
					</Link>
				</p>
			</section>
		</main>
	);
}
