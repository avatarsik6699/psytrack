import React from 'react';
import { Outlet } from 'react-router';

import { useAuthGuard } from '@features/auth/use-auth-guard';
import { Sidebar } from '@shared/ui/sidebar';
import { TopBar } from '@shared/ui/top-bar';

const PatientLayout: React.FC = () => {
	useAuthGuard();

	return (
		<div className='flex min-h-screen bg-muted/40'>
			<TopBar activeRole='patient' />
			<Sidebar role='patient' />
			<main
				className='flex-1 ml-(--docassist-sidebar-width,180px)'
				style={{ paddingTop: 'var(--docassist-topbar-height)' }}
			>
				<Outlet />
			</main>
		</div>
	);
};

export default PatientLayout;
