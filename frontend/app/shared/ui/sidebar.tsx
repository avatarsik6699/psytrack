import { Activity, AlertTriangle, Calendar, ClipboardList, Home, Pill, Settings, User, Users } from 'lucide-react';
import { NavLink } from 'react-router';

import { useLogoutMutation } from '@shared/api/auth';
import { usePatientTasks } from '@shared/api/tasks';
import { useMySideEffects } from '@shared/api/side-effects';

import { cn } from '@/lib/utils';

interface SidebarProps {
	role: 'doctor' | 'patient';
}

const doctorNav = [
	{ to: '/doctor', icon: Users, label: 'Patients' },
	{ to: '/doctor/schedule', icon: Calendar, label: 'Schedule' },
	{ to: '/doctor/settings', icon: Settings, label: 'Settings' },
	{ to: '/doctor/account', icon: User, label: 'My Account' },
];

function PatientSidebar() {
	const { data: tasks = [] } = usePatientTasks();
	const { data: seList = [] } = useMySideEffects();

	const testBadge = (tasks ?? []).filter(
		t => t.task_type === 'test' && t.status === 'pending'
	).length;
	const seBadge = (seList as { resolved: boolean }[]).filter(r => !r.resolved).length;

	const patientNav = [
		{ to: '/dashboard', icon: Home, label: 'Главная', badge: 0 },
		{ to: '/tests', icon: ClipboardList, label: 'Тесты', badge: testBadge },
		{ to: '/drugs', icon: Pill, label: 'Препараты', badge: 0 },
		{ to: '/side-effects', icon: AlertTriangle, label: 'Побочные эффекты', badge: seBadge },
		{ to: '/profile', icon: User, label: 'Профиль', badge: 0 },
	];

	const logoutMutation = useLogoutMutation();

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 flex flex-col justify-between',
				'bg-white border-r border-border py-4',
				'w-(--docassist-sidebar-width,180px)'
			)}
		>
			<div>
				<div className='px-4 mb-6'>
					<span className='font-semibold text-docassist-primary text-sm'>PsychTrack</span>
					<p className='text-[10px] text-muted-foreground'>Мониторинг</p>
				</div>
				<nav className='flex flex-col gap-1 px-2'>
					{patientNav.map(({ to, icon: Icon, label, badge }) => (
						<NavLink
							key={to}
							to={to}
							end={to === '/dashboard'}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-docassist-primary-subtle text-docassist-primary font-medium'
										: 'text-muted-foreground hover:bg-muted'
								)
							}
						>
							<Icon size={15} className='shrink-0' />
							<span className='flex-1 truncate text-xs leading-4'>{label}</span>
							{badge > 0 && (
								<span className='shrink-0 min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1'>
									{badge}
								</span>
							)}
						</NavLink>
					))}
				</nav>
			</div>

			<div className='px-2 flex flex-col gap-1'>
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
}

function DoctorSidebar() {
	const logoutMutation = useLogoutMutation();

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 flex flex-col justify-between',
				'bg-white border-r border-border py-4',
				'w-(--docassist-sidebar-width,180px)'
			)}
		>
			<div>
				<div className='px-4 mb-6'>
					<span className='font-semibold text-docassist-primary text-sm'>Docassist</span>
					<p className='text-[10px] text-muted-foreground'>Psychiatry Monitor</p>
				</div>
				<nav className='flex flex-col gap-1 px-2'>
					{doctorNav.map(({ to, icon: Icon, label }) => (
						<NavLink
							key={to}
							to={to}
							end
							className={({ isActive }) =>
								cn(
									'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-docassist-primary-subtle text-docassist-primary font-medium'
										: 'text-muted-foreground hover:bg-muted'
								)
							}
						>
							<Icon size={16} />
							{label}
						</NavLink>
					))}
				</nav>
			</div>

			<div className='px-2 flex flex-col gap-1'>
				<button
					type='button'
					onClick={() => logoutMutation.mutate()}
					className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground text-left'
				>
					Sign out
				</button>
			</div>
		</aside>
	);
}

export function Sidebar({ role }: SidebarProps) {
	return role === 'patient' ? <PatientSidebar /> : <DoctorSidebar />;
}
