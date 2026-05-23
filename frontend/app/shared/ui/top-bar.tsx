import { AlertTriangle, ClipboardList, HeartPulse, Home, LogOut, Pill, UserRound, Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { useCurrentSession, useLogoutMutation } from '@shared/api/auth';
import { usePatientMe } from '@shared/api/patient-me';
import { useMySideEffects } from '@shared/api/side-effects';
import { usePatientTasks } from '@shared/api/tasks';
import { useRouter } from '@shared/hooks/use-router';

import { cn } from '@/lib/utils';

type Role = 'doctor' | 'patient';
type Props = { activeRole: Role };

function formatBadgeCount(count: number) {
	return count > 9 ? '9+' : String(count);
}

const NotificationBadge: React.FC<{ count: number }> = props => {
	if (props.count <= 0) return null;
	return (
		<span className='inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white tabular-nums'>
			{formatBadgeCount(props.count)}
		</span>
	);
};

const PatientTopBar: React.FC = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const logoutMutation = useLogoutMutation();
	const tasksQuery = usePatientTasks();
	const seQuery = useMySideEffects();
	const meQuery = usePatientMe();
	const me = meQuery.data as { full_name?: string } | undefined;
	const testBadge = (tasksQuery.data ?? []).filter(t => t.task_type === 'test' && t.status === 'pending').length;
	const seBadge = ((seQuery.data ?? []) as { resolved: boolean }[]).filter(r => !r.resolved).length;
	const meInitial = me?.full_name?.[0]?.toUpperCase() ?? '?';

	const nav = [
		{ to: '/dashboard', icon: Home, label: t('nav.home'), badge: 0, end: true },
		{ to: '/drugs', icon: Pill, label: t('nav.drugs'), badge: 0, end: false },
		{ to: '/tests', icon: ClipboardList, label: t('nav.tests'), badge: testBadge, end: false },
		{ to: '/side-effects', icon: AlertTriangle, label: t('nav.sideEffectsShort'), badge: seBadge, end: false },
		{ to: '/profile', icon: UserRound, label: t('nav.profile'), badge: 0, end: false },
	];

	return (
		<header
			className='fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 md:px-4 bg-card border-b border-border'
			style={{ height: 'var(--docassist-topbar-height)' }}
		>
			<div className='flex shrink-0 items-center gap-2 mr-1'>
				<HeartPulse size={18} className='text-docassist-primary shrink-0' />
				<span className='hidden text-sm font-semibold text-foreground lg:inline'>{t('brand')}</span>
			</div>

			<nav className='flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto'>
				{nav.map(item => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.end}
						className={({ isActive }) =>
							cn(
								'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
								isActive
									? 'bg-docassist-primary-subtle text-docassist-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							)
						}
					>
						<item.icon size={13} className='shrink-0' />
						<span>{item.label}</span>
						<NotificationBadge count={item.badge} />
					</NavLink>
				))}
			</nav>

			<div className='flex shrink-0 items-center gap-1'>
				<div className='flex items-center gap-1.5'>
					<div className='w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0'>
						<span className='text-foreground text-[10px] font-bold'>{meInitial}</span>
					</div>
					<span className='hidden md:inline text-xs font-medium truncate max-w-25'>{me?.full_name}</span>
				</div>
				<button
					type='button'
					onClick={() =>
						logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })
					}
					className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted ml-1'
					title={t('actions.logout')}
				>
					<LogOut size={13} />
					<span className='hidden sm:inline'>{t('actions.logout')}</span>
				</button>
			</div>
		</header>
	);
};

const DoctorTopBar: React.FC = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const logoutMutation = useLogoutMutation();
	const sessionQuery = useCurrentSession();
	const session = sessionQuery.data;
	const displayName = session?.display_name ?? '';
	const initial = displayName.trim()[0]?.toUpperCase() ?? 'D';

	const nav = [
		{ to: '/doctor', icon: Users, label: t('nav.patients'), end: true },
		{ to: '/doctor/profile', icon: UserRound, label: t('nav.profile'), end: false },
	];

	return (
		<header
			className='fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 md:px-4 bg-card border-b border-border'
			style={{ height: 'var(--docassist-topbar-height)' }}
		>
			<div className='flex shrink-0 items-center gap-2 mr-1'>
				<HeartPulse size={18} className='text-docassist-primary shrink-0' />
				<span className='hidden text-sm font-semibold text-foreground lg:inline'>{t('brand')}</span>
			</div>

			<nav className='flex min-w-0 flex-1 items-center gap-0.5'>
				{nav.map(item => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.end}
						className={({ isActive }) =>
							cn(
								'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
								isActive
									? 'bg-docassist-primary-subtle text-docassist-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							)
						}
					>
						<item.icon size={13} className='shrink-0' />
						<span>{item.label}</span>
					</NavLink>
				))}
			</nav>

			<div className='flex shrink-0 items-center gap-1'>
				<div className='flex items-center gap-1.5'>
					<div className='w-6 h-6 rounded-full bg-docassist-accent flex items-center justify-center shrink-0'>
						<span className='text-white text-[10px] font-bold'>{initial}</span>
					</div>
					<span className='hidden md:inline text-xs font-medium truncate max-w-30'>{displayName}</span>
				</div>
				<button
					type='button'
					onClick={() =>
						logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })
					}
					className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted ml-1'
					title={t('actions.logout')}
				>
					<LogOut size={13} />
					<span className='hidden sm:inline'>{t('actions.logout')}</span>
				</button>
			</div>
		</header>
	);
};

export const TopBar: React.FC<Props> = props => {
	return props.activeRole === 'patient' ? <PatientTopBar /> : <DoctorTopBar />;
};
