import { Outlet } from 'react-router';

import { useAuthGuard } from '@features/auth/use-auth-guard';
import { Sidebar } from '@shared/ui/sidebar';

export default function DoctorLayout() {
	useAuthGuard();

	return (
		<div className='flex min-h-screen'>
			<Sidebar role='doctor' />
			<main className='flex-1 ml-[var(--docassist-sidebar-width,180px)]'>
				<Outlet />
			</main>
		</div>
	);
}
