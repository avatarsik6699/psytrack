import LoginPage from '@pages/auth/login';

export function meta() {
	return [{ title: 'Вход — PsychTrack' }];
}

export default function LoginRoute() {
	return <LoginPage />;
}
