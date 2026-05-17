import { index, layout, route } from '@react-router/dev/routes';

export default [
	route('login', './routes/login.tsx'),
	route('register', './routes/register.tsx'),
	// Patient-protected routes
	layout('./layouts/patient-layout.tsx', [
		index('./routes/_index.tsx'),
		route('history', './routes/history.tsx'),
		route('profile', './routes/profile.tsx'),
	]),
	// Doctor-protected routes
	layout('./layouts/doctor-layout.tsx', [
		route('doctor', './routes/doctor/_index.tsx'),
		route('doctor/patients/:id', './routes/doctor/patients.$id.tsx'),
	]),
];
