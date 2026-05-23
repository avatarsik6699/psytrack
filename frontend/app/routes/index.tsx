import HomePage from '@pages/home';

export function meta() {
	return [{ title: 'PsychTrack' }, { name: 'description', content: 'Кабинет клинического мониторинга.' }];
}

export default function HomeRoute() {
	return <HomePage />;
}
