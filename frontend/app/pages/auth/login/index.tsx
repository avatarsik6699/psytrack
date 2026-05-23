import { CheckCircle2, HeartPulse } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginForm } from '@features/auth/login-form';

const FEATURE_KEYS = ['login.feature1', 'login.feature2', 'login.feature3', 'login.feature4'] as const;

const TESTIMONIAL_INDEXES = [0, 1, 2] as const;

export default function LoginPage() {
	const { t } = useTranslation('common');
	const [activeTestimonial, setActiveTestimonial] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setActiveTestimonial(prev => (prev + 1) % TESTIMONIAL_INDEXES.length);
		}, 5000);
		return () => clearInterval(id);
	}, []);

	return (
		<main className='flex min-h-screen bg-background'>
			{/* Left branding panel — visible on large screens */}
			<div className='hidden lg:flex lg:w-105 shrink-0 flex-col bg-docassist-primary p-10'>
				{/* Logo */}
				<div className='flex items-center gap-3'>
					<div className='flex size-9 items-center justify-center rounded-xl bg-white/20'>
						<HeartPulse size={20} className='text-white' />
					</div>
					<div>
						<p className='text-base font-bold text-white'>{t('brand')}</p>
						<p className='text-xs text-white/70'>{t('clinicalMonitoring')}</p>
					</div>
				</div>

				{/* Feature content */}
				<div className='mt-14 flex-1'>
					<h2 className='whitespace-pre-line text-3xl font-bold leading-tight text-white'>
						{t('login.brandHeadline')}
					</h2>
					<p className='mt-4 text-sm leading-relaxed text-white/75'>{t('login.featureDescription')}</p>
					<ul className='mt-8 space-y-3'>
						{FEATURE_KEYS.map(key => (
							<li key={key} className='flex items-center gap-3'>
								<CheckCircle2 size={15} className='shrink-0 text-white/60' />
								<span className='text-sm text-white/90'>{t(key)}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Testimonials carousel */}
				<div className='mt-auto pt-10'>
					<div className='overflow-hidden rounded-xl bg-white/10 p-5'>
						<div className='grid'>
							{TESTIMONIAL_INDEXES.map(i => (
								<div
									key={i}
									className={`col-start-1 row-start-1 transition-opacity duration-500 ${i === activeTestimonial ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
								>
									<p className='text-sm italic leading-relaxed text-white/90'>
										&ldquo;{t(`login.testimonial${i}Text`)}&rdquo;
									</p>
									<div className='mt-4 flex items-center gap-3'>
										<div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white'>
											{t(`login.testimonial${i}Initials`)}
										</div>
										<div>
											<p className='text-sm font-semibold text-white'>{t(`login.testimonial${i}Name`)}</p>
											<p className='text-xs text-white/60'>{t(`login.testimonial${i}Role`)}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
					{/* Navigation dots */}
					<div className='mt-3 flex gap-1.5'>
						{TESTIMONIAL_INDEXES.map(i => (
							<button
								key={i}
								type='button'
								onClick={() => setActiveTestimonial(i)}
								className={`h-1 rounded-full transition-all ${i === activeTestimonial ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
								aria-label={`Testimonial ${i + 1}`}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Right form panel */}
			<div className='flex flex-1 flex-col items-center justify-center px-6 py-12'>
				{/* Mobile logo — hidden on large screens */}
				<div className='mb-8 flex flex-col items-center gap-2 lg:hidden'>
					<div className='flex size-10 items-center justify-center rounded-xl bg-docassist-primary/10'>
						<HeartPulse size={20} className='text-docassist-primary' />
					</div>
					<p className='text-sm font-bold text-docassist-primary'>{t('brand')}</p>
				</div>

				<section className='w-full max-w-100' aria-labelledby='login-title'>
					<div className='mb-6'>
						<h1 id='login-title' className='text-2xl font-semibold tracking-tight'>
							{t('login.title')}
						</h1>
						<p className='mt-1 text-sm text-muted-foreground'>{t('login.subtitle')}</p>
					</div>

					<LoginForm />

					<p className='mt-6 text-center text-xs text-muted-foreground/70 leading-relaxed'>{t('login.disclaimer')}</p>
				</section>
			</div>
		</main>
	);
}
