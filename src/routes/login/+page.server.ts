import { APIError } from 'better-auth/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, '/dashboard');
};

export const actions: Actions = {
	signIn: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';
		if (!email || !password) return fail(400, { message: 'Enter your email and password.' });
		try {
			await locals.auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError)
				return fail(400, { message: 'Email or password is incorrect.' });
			return fail(500, { message: 'We could not sign you in. Please try again.' });
		}
		redirect(302, '/dashboard');
	},
	signUp: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';
		if (!name || !email || password.length < 8)
			return fail(400, { message: 'Add your name and use a password with at least 8 characters.' });
		try {
			await locals.auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError)
				return fail(400, { message: error.message || 'Could not create account.' });
			return fail(500, { message: 'We could not create your account. Please try again.' });
		}
		redirect(302, '/dashboard');
	},
	google: async ({ locals }) => {
		const result = await locals.auth.api.signInSocial({
			body: { provider: 'google', callbackURL: '/dashboard' }
		});
		if (!result.url) return fail(400, { message: 'Google sign-in is unavailable.' });
		redirect(302, result.url);
	}
};
