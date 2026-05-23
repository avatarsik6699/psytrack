import React, { useEffect } from 'react';
import { Outlet } from 'react-router';

import { useAuthGuard } from '@features/auth/use-auth-guard';
import { useCurrentSession } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { TopBar } from '@shared/ui/top-bar';

const PatientLayout: React.FC = () => {
	const { isAuthenticated } = useAuthGuard();
	const router = useRouter();
	const sessionQuery = useCurrentSession();
	const role = sessionQuery.data?.role;

	useEffect(() => {
		if (isAuthenticated && role === 'doctor') {
			router.navigate('/doctor', { replace: true });
		}
	}, [isAuthenticated, role, router]);

	if (!isAuthenticated || sessionQuery.isLoading || role === 'doctor') {
		return null;
	}

	return (
		<div className='min-h-screen bg-muted/40'>
			<TopBar activeRole='patient' />
			<main style={{ paddingTop: 'var(--docassist-topbar-height)' }}>
				<Outlet />
			</main>
		</div>
	);
};

export default PatientLayout;
