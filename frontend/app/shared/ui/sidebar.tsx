import { AlertTriangle, ClipboardList, Home, LogOut, Pill, UserRound, Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { useCurrentSession, useLogoutMutation } from '@shared/api/auth';
import { usePatientMe } from '@shared/api/patient-me';
import { useMySideEffects } from '@shared/api/side-effects';
import { usePatientTasks } from '@shared/api/tasks';
import { date } from '@shared/lib/date';

import { cn } from '@/lib/utils';

type SidebarRole = 'doctor' | 'patient';

type Props = {
	role: SidebarRole;
};

const PatientSidebar: React.FC = () => {
	const { t } = useTranslation('common');
	const tasksQuery = usePatientTasks();
	const tasks = tasksQuery.data ?? [];
	const seQuery = useMySideEffects();
	const seList = seQuery.data ?? [];
	const logoutMutation = useLogoutMutation();

	const testBadge = tasks.filter(t => t.task_type === 'test' && t.status === 'pending').length;
	const seBadge = (seList as { resolved: boolean }[]).filter(r => !r.resolved).length;

	const patientMeQuery = usePatientMe();
	const me = patientMeQuery.data as { full_name?: string; birth_date?: string | null } | undefined;
	const meInitial = me?.full_name?.[0]?.toUpperCase() ?? '?';
	const meAge = date.ageLabel(me?.birth_date);

	const patientNav = [
		{ to: '/dashboard', icon: Home, label: t('nav.home'), badge: 0 },
		{ to: '/drugs', icon: Pill, label: t('nav.drugs'), badge: 0 },
		{ to: '/tests', icon: ClipboardList, label: t('nav.tests'), badge: testBadge },
		{ to: '/side-effects', icon: AlertTriangle, label: t('nav.sideEffects'), badge: seBadge },
		{ to: '/profile', icon: UserRound, label: t('nav.profile'), badge: 0 },
	];

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 hidden flex-col justify-between md:flex',
				'bg-sidebar text-sidebar-foreground border-r border-sidebar-border py-4',
				'w-(--docassist-sidebar-width,180px)'
			)}
			style={{ top: 'var(--docassist-topbar-height)' }}
		>
			<div>
				<div className='px-4 mb-6'>
					<div className='flex items-center gap-2'>
						<div className='w-7 h-7 rounded-lg bg-docassist-primary/10 flex items-center justify-center shrink-0'>
							<span className='text-docassist-primary text-xs font-bold'>PT</span>
						</div>
						<div>
							<span className='font-semibold text-docassist-primary text-sm leading-tight'>{t('brand')}</span>
							<p className='text-[10px] text-muted-foreground'>{t('monitoring')}</p>
						</div>
					</div>
				</div>
				<nav className='flex flex-col gap-1 px-2'>
					{patientNav.map(navItem => (
						<NavLink
							key={navItem.to}
							to={navItem.to}
							end={navItem.to === '/dashboard'}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-docassist-primary-subtle text-docassist-primary font-medium'
										: 'text-muted-foreground hover:bg-muted'
								)
							}
						>
							<navItem.icon size={15} className='shrink-0' />
							<span className='flex-1 truncate text-xs leading-4'>{navItem.label}</span>
							{navItem.badge > 0 && (
								<span className='shrink-0 min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1'>
									{navItem.badge}
								</span>
							)}
						</NavLink>
					))}
				</nav>
			</div>

			<div className='px-2 flex flex-col gap-2'>
				{me?.full_name && (
					<div className='px-2 py-2 flex items-center gap-2 rounded-lg bg-muted/50'>
						<div className='w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0'>
							<span className='text-white text-xs font-bold'>{meInitial}</span>
						</div>
						<div className='min-w-0'>
							<p className='text-xs font-medium truncate'>{me.full_name}</p>
							<p className='text-[10px] text-muted-foreground truncate'>
								{meAge ? `${meAge} · ${t('roles.patient')}` : t('roles.patient')}
							</p>
						</div>
					</div>
				)}
				<button
					type='button'
					onClick={() => logoutMutation.mutate()}
					className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground text-left'
				>
					<LogOut size={13} />
					{t('actions.logout')}
				</button>
			</div>
		</aside>
	);
};

const DoctorSidebar: React.FC = () => {
	const { t } = useTranslation('common');
	const logoutMutation = useLogoutMutation();
	const sessionQuery = useCurrentSession();
	const session = sessionQuery.data;
	const displayName = session?.display_name ?? (sessionQuery.isLoading ? t('loading') : t('profile.doctorFallback'));
	const specialty = session?.specialty ?? (sessionQuery.isLoading ? t('profile.checkingSession') : t('profile.specialtyEmpty'));
	const initial = displayName.trim()[0]?.toUpperCase() ?? t('roles.doctor')[0]?.toUpperCase() ?? 'D';
	const doctorNav = [
		{ to: '/doctor', icon: Users, label: t('nav.patients') },
		{ to: '/doctor/profile', icon: UserRound, label: t('nav.profile') },
	];

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 hidden flex-col justify-between md:flex',
				'bg-sidebar text-sidebar-foreground border-r border-sidebar-border py-4',
				'w-(--docassist-sidebar-width,180px)'
			)}
			style={{ top: 'var(--docassist-topbar-height)' }}
		>
			<div>
				<div className='px-4 mb-6'>
					<div className='flex items-center gap-2'>
						<div className='w-7 h-7 rounded-lg bg-docassist-primary/10 flex items-center justify-center shrink-0'>
							<span className='text-docassist-primary text-xs font-bold'>PT</span>
						</div>
						<div>
							<span className='font-semibold text-docassist-primary text-sm leading-tight'>{t('brand')}</span>
							<p className='text-[10px] text-muted-foreground'>{t('monitoring')}</p>
						</div>
					</div>
				</div>
				<nav className='flex flex-col gap-1 px-2'>
					{doctorNav.map(navItem => (
						<NavLink
							key={navItem.to}
							to={navItem.to}
							end={navItem.to === '/doctor'}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-docassist-primary-subtle text-docassist-primary font-medium'
										: 'text-muted-foreground hover:bg-muted'
								)
							}
						>
							<navItem.icon size={15} className='shrink-0' />
							<span className='flex-1 truncate text-xs leading-4'>{navItem.label}</span>
						</NavLink>
					))}
				</nav>
			</div>

			<div className='px-2 flex flex-col gap-2'>
				<div className='px-2 py-2 flex items-center gap-2 rounded-lg bg-muted/50'>
					<div className='w-7 h-7 rounded-full bg-docassist-accent flex items-center justify-center shrink-0'>
						<span className='text-white text-xs font-bold'>{initial}</span>
					</div>
					<div className='min-w-0'>
						<p className='text-xs font-medium truncate'>{displayName}</p>
						<p className='text-[10px] text-muted-foreground truncate'>{specialty}</p>
					</div>
				</div>
				<button
					type='button'
					onClick={() => logoutMutation.mutate()}
					className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground text-left'
				>
					<LogOut size={13} />
					{t('actions.logout')}
				</button>
			</div>
		</aside>
	);
};

export const Sidebar: React.FC<Props> = props => {
	return props.role === 'patient' ? <PatientSidebar /> : <DoctorSidebar />;
};
