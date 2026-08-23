import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	signOut: async ({ locals, request }) => {
		await locals.auth.api.signOut({ headers: request.headers });
		redirect(302, '/');
	}
};
