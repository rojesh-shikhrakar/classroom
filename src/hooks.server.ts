import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (!event.platform?.env?.DB)
		throw new Error('D1 binding "DB" not found - are you running with wrangler?');

	event.locals.auth = createAuth(event.platform.env.DB);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	// Route groups do not change the URL, but they give every private route a
	// single, server-side access boundary. This also protects form actions and
	// future endpoints nested under `(private)`.
	if (event.route.id?.startsWith('/(private)') && !event.locals.user) {
		redirect(303, '/login');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
