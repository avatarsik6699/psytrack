import React, { useEffect } from 'react';
import { Outlet } from 'react-router';

import { useAuthGuard } from '@features/auth/use-auth-guard';
import { useCurrentSession } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { TopBar } from '@shared/ui/top-bar';

const DoctorLayout: React.FC = () => {
	const { isAuthenticated } = useAuthGuard();
	const router = useRouter();
	const sessionQuery = useCurrentSession();
	const role = sessionQuery.data?.role;

	useEffect(() => {
		if (isAuthenticated && role === 'patient') {
			router.navigate('/dashboard', { replace: true });
		}
	}, [isAuthenticated, role, router]);

	if (!isAuthenticated || sessionQuery.isLoading || role === 'patient') {
		return null;
	}

	return (
		<div className='min-h-screen bg-muted/40'>
			<TopBar activeRole='doctor' />
			<main style={{ paddingTop: 'var(--docassist-topbar-height)' }}>
				<Outlet />
			</main>
		</div>
	);
};

export default DoctorLayout;
