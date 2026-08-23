import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	return { user: locals.user };
};
export const actions: Actions = {
	signOut: async ({ locals, request }) => {
		await locals.auth.api.signOut({ headers: request.headers });
		redirect(302, '/');
	}
};
