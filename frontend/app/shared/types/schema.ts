export interface paths {
	'/api/v1/health': {
		get: operations['health_check_api_v1_health_get'];
	};
	'/api/v1/public/auth/login': {
		post: operations['login_api_v1_public_auth_login_post'];
	};
	'/api/v1/public/auth/register': {
		post: operations['register_api_v1_public_auth_register_post'];
	};
	'/api/v1/public/auth/refresh': {
		post: operations['refresh_api_v1_public_auth_refresh_post'];
	};
	'/api/v1/public/auth/patient-login': {
		post: operations['patient_login_api_v1_public_auth_patient_login_post'];
	};
	'/api/v1/public/auth/me': {
		get: operations['me_api_v1_public_auth_me_get'];
		delete: operations['delete_me_api_v1_public_auth_me_delete'];
	};
	'/api/v1/public/auth/me/password': {
		patch: operations['change_password_api_v1_public_auth_me_password_patch'];
	};
	'/api/v1/public/auth/logout': {
		post: operations['logout_api_v1_public_auth_logout_post'];
	};
}

export interface components {
	schemas: {
		LoginRequest: { email: string; password: string };
		RegisterRequest: { email: string; password: string; full_name: string; consent_152fz: true };
		RefreshRequest: { refresh_token: string };
		PatientTempLoginRequest: { temp_login: string; password: string };
		PasswordChangeRequest: { current_password: string; new_password: string };
		TokenPair: { access_token: string; refresh_token: string; token_type: string };
		UserOut: {
			id: string;
			email: string | null;
			role: 'doctor' | 'patient';
			is_active: boolean;
			consent_152fz: boolean;
			created_at: string;
		};
		AccountDeletionResponse: { deleted: boolean };
		HealthResponse: { status: string; db: string };
	};
}

interface operations {
	health_check_api_v1_health_get: {
		responses: { 200: { content: { 'application/json': components['schemas']['HealthResponse'] } } };
	};
	login_api_v1_public_auth_login_post: {
		requestBody: { content: { 'application/json': components['schemas']['LoginRequest'] } };
		responses: { 200: { content: { 'application/json': components['schemas']['TokenPair'] } } };
	};
	register_api_v1_public_auth_register_post: {
		requestBody: { content: { 'application/json': components['schemas']['RegisterRequest'] } };
		responses: { 201: { content: { 'application/json': components['schemas']['TokenPair'] } } };
	};
	refresh_api_v1_public_auth_refresh_post: {
		requestBody: { content: { 'application/json': components['schemas']['RefreshRequest'] } };
		responses: { 200: { content: { 'application/json': components['schemas']['TokenPair'] } } };
	};
	patient_login_api_v1_public_auth_patient_login_post: {
		requestBody: { content: { 'application/json': components['schemas']['PatientTempLoginRequest'] } };
		responses: { 200: { content: { 'application/json': components['schemas']['TokenPair'] } } };
	};
	me_api_v1_public_auth_me_get: {
		responses: { 200: { content: { 'application/json': components['schemas']['UserOut'] } } };
	};
	delete_me_api_v1_public_auth_me_delete: {
		responses: { 200: { content: { 'application/json': components['schemas']['AccountDeletionResponse'] } } };
	};
	change_password_api_v1_public_auth_me_password_patch: {
		requestBody: { content: { 'application/json': components['schemas']['PasswordChangeRequest'] } };
		responses: { 200: { content: { 'application/json': { ok: boolean } } } };
	};
	logout_api_v1_public_auth_logout_post: {
		responses: { 200: { content: { 'application/json': { message: string } } } };
	};
}
