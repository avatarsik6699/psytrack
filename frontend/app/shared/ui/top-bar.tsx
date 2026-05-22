import { HeartPulse } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';

type Role = 'doctor' | 'patient';

type Props = {
	activeRole: Role;
};

export const TopBar: React.FC<Props> = props => {
	return (
		<header
			className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4'
			style={{ height: 'var(--docassist-topbar-height)', background: 'oklch(0.13 0.01 240)' }}
		>
			<div className='flex items-center gap-2'>
				<HeartPulse size={18} className='text-docassist-primary' />
				<span className='text-white font-semibold text-sm'>PsychTrack</span>
			</div>

			<div className='flex items-center gap-1 rounded-full border border-white/20 p-0.5'>
				<NavLink
					to='/doctor'
					className={cn(
						'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
						props.activeRole === 'doctor' ? 'bg-white text-gray-900' : 'text-white/60 hover:text-white/90'
					)}
				>
					Врач
				</NavLink>
				<NavLink
					to='/dashboard'
					className={cn(
						'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
						props.activeRole === 'patient' ? 'bg-white text-gray-900' : 'text-white/60 hover:text-white/90'
					)}
				>
					Пациент
				</NavLink>
			</div>
		</header>
	);
};
