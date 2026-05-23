import { ClipboardList, HeartPulse, Home, Pill, UserRound, Users, AlertTriangle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';

type Role = 'doctor' | 'patient';

type Props = {
	activeRole: Role;
};

export const TopBar: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const patientMobileNav = [
		{ to: '/dashboard', icon: Home, label: t('nav.home') },
		{ to: '/drugs', icon: Pill, label: t('nav.drugs') },
		{ to: '/tests', icon: ClipboardList, label: t('nav.tests') },
		{ to: '/side-effects', icon: AlertTriangle, label: t('nav.sideEffectsShort') },
		{ to: '/profile', icon: UserRound, label: t('nav.profile') },
	];
	const doctorMobileNav = [
		{ to: '/doctor', icon: Users, label: t('nav.patients') },
		{ to: '/doctor/profile', icon: UserRound, label: t('nav.profile') },
	];
	const mobileNav = props.activeRole === 'doctor' ? doctorMobileNav : patientMobileNav;

	return (
		<header
			className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-3 md:px-4'
			style={{ height: 'var(--docassist-topbar-height)', background: 'oklch(0.13 0.01 240)' }}
		>
			<div className='flex min-w-0 items-center gap-2'>
				<HeartPulse size={18} className='text-docassist-primary' />
				<span className='hidden text-sm font-semibold text-white sm:inline'>{t('brand')}</span>
			</div>

			<nav className='flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:hidden'>
				{mobileNav.map(navItem => (
					<NavLink
						key={navItem.to}
						to={navItem.to}
						end={navItem.to === '/dashboard' || navItem.to === '/doctor'}
						className={({ isActive }) =>
							cn(
								'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
								isActive ? 'bg-white text-gray-950' : 'text-white/70 hover:text-white'
							)
						}
					>
						<navItem.icon size={13} className='shrink-0' />
						<span>{navItem.label}</span>
					</NavLink>
				))}
			</nav>
		</header>
	);
};
