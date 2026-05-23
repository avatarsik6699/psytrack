import { DashboardPage } from '@pages/dashboard/ui/dashboard-page';

export function meta() {
	return [{ title: 'Главная — PsychTrack' }];
}

export default function DashboardRoute() {
	return <DashboardPage />;
}
