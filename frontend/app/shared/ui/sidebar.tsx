import { Activity, Calendar, Clock, Home, Settings, User, Users } from 'lucide-react';
import { NavLink } from 'react-router';

import { useLogoutMutation } from '@shared/api/auth';

import { cn } from '@/lib/utils';

interface SidebarProps {
	role: 'doctor' | 'patient';
}

const patientNav = [
	{ to: '/', icon: Home, label: 'Home' },
	{ to: '/dashboard', icon: Activity, label: 'Dashboard' },
	{ to: '/history', icon: Clock, label: 'History' },
	{ to: '/profile', icon: User, label: 'Profile' },
];

const doctorNav = [
	{ to: '/doctor', icon: Users, label: 'Patients' },
	{ to: '/doctor/schedule', icon: Calendar, label: 'Schedule' },
	{ to: '/doctor/settings', icon: Settings, label: 'Settings' },
	{ to: '/doctor/account', icon: User, label: 'My Account' },
];

export function Sidebar({ role }: SidebarProps) {
	const nav = role === 'patient' ? patientNav : doctorNav;
	const switchTo = role === 'patient' ? '/doctor' : '/';
	const switchLabel = role === 'patient' ? 'Doctor View' : 'Patient View';
	const logoutMutation = useLogoutMutation();

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 flex flex-col justify-between',
				'bg-white border-r border-border py-4',
				'w-[var(--docassist-sidebar-width,180px)]'
			)}
		>
			<div>
				<div className='px-4 mb-6'>
					<span className='font-semibold text-docassist-primary text-sm'>Docassist</span>
					<p className='text-[10px] text-muted-foreground'>Psychiatry Monitor</p>
				</div>
				<nav className='flex flex-col gap-1 px-2'>
					{nav.map(({ to, icon: Icon, label }) => (
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
				<NavLink
					to={switchTo}
					className='flex items-center gap-2 px-3 py-2 text-xs text-docassist-primary border border-docassist-primary rounded-md hover:bg-docassist-primary-subtle transition-colors'
				>
					{switchLabel}
				</NavLink>
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
