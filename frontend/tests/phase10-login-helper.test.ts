import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('phase 10 login demo helper guard', () => {
	it('renders demo credentials only behind the development runtime guard', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'app/features/auth/login-form.tsx'),
			'utf8'
		);

		expect(source).toContain('runtime.isDev ?');
		expect(source).toContain("tCommon('login.devCredentials')");
		expect(source).toContain('fillDevCredentials');
	});
});
