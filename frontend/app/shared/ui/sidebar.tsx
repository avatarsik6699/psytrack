import { AlertTriangle, ClipboardList, Home, Pill, Settings, Users } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router';

import { useLogoutMutation } from '@shared/api/auth';
import { usePatientMe } from '@shared/api/patient-me';
import { useMySideEffects } from '@shared/api/side-effects';
import { usePatientTasks } from '@shared/api/tasks';
import { date } from '@shared/lib/date';

import { cn } from '@/lib/utils';

type SidebarRole = 'doctor' | 'patient';

type Props = {
	role: SidebarRole;
};

const doctorNav = [
	{ to: '/doctor', icon: Users, label: 'Пациенты' },
	{ to: '/doctor/settings', icon: Settings, label: 'Настройки' },
];

const PatientSidebar: React.FC = () => {
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
		{ to: '/dashboard', icon: Home, label: 'Главная', badge: 0 },
		{ to: '/drugs', icon: Pill, label: 'Препараты', badge: 0 },
		{ to: '/tests', icon: ClipboardList, label: 'Тесты', badge: testBadge },
		{ to: '/side-effects', icon: AlertTriangle, label: 'Побочные эффекты', badge: seBadge },
	];

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 flex flex-col justify-between',
				'bg-white border-r border-border py-4',
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
							<span className='font-semibold text-docassist-primary text-sm leading-tight'>PsychTrack</span>
							<p className='text-[10px] text-muted-foreground'>Мониторинг</p>
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
							<p className='text-[10px] text-muted-foreground truncate'>{meAge ? `${meAge} · Пациент` : 'Пациент'}</p>
						</div>
					</div>
				)}
				<button
					type='button'
					onClick={() => logoutMutation.mutate()}
					className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground text-left'
				>
					Выйти
				</button>
			</div>
		</aside>
	);
};

const DoctorSidebar: React.FC = () => {
	const logoutMutation = useLogoutMutation();

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 flex flex-col justify-between',
				'bg-white border-r border-border py-4',
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
							<span className='font-semibold text-docassist-primary text-sm leading-tight'>PsychTrack</span>
							<p className='text-[10px] text-muted-foreground'>Мониторинг</p>
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
						<span className='text-white text-xs font-bold'>В</span>
					</div>
					<div className='min-w-0'>
						<p className='text-xs font-medium truncate'>Волков А.Н.</p>
						<p className='text-[10px] text-muted-foreground truncate'>Психиатр</p>
					</div>
				</div>
				<button
					type='button'
					onClick={() => logoutMutation.mutate()}
					className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground text-left'
				>
					Выйти
				</button>
			</div>
		</aside>
	);
};

export const Sidebar: React.FC<Props> = props => {
	return props.role === 'patient' ? <PatientSidebar /> : <DoctorSidebar />;
};
