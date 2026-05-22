import { index, layout, route } from '@react-router/dev/routes';

export default [
	route('login', './routes/login.tsx'),
	route('register', './routes/register.tsx'),
	// Patient-protected routes
	layout('./layouts/patient-layout.tsx', [
		index('./routes/index.tsx'),
		route('dashboard', './routes/dashboard.tsx'),
		route('history', './routes/history.tsx'),
		route('profile', './routes/profile/index.tsx'),
		route('tests', './routes/tests/index.tsx'),
		route('drugs', './routes/drugs/index.tsx'),
		route('side-effects', './routes/side-effects/index.tsx'),
		route('assessment/:patientScaleId', './routes/assessment/index.tsx'),
	]),
	// Doctor-protected routes
	layout('./layouts/doctor-layout.tsx', [
		route('doctor', './routes/doctor/index.tsx'),
		route('doctor/patients/:id', './routes/doctor/patient-detail.tsx'),
	]),
];
