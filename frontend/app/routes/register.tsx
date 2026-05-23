import { redirect } from 'react-router';

import RegisterPage from '@pages/auth/register';

export function meta() {
	return [{ title: 'Регистрация врача — PsychTrack' }];
}

export async function loader() {
	return redirect('/login');
}

export default function RegisterRoute() {
	return <RegisterPage />;
}
