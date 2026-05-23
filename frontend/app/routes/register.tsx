import RegisterPage from '@pages/auth/register';

export function meta() {
	return [{ title: 'Регистрация врача — PsychTrack' }];
}

export default function RegisterRoute() {
	return <RegisterPage />;
}
