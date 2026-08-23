import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export async function isAdmin(platform: App.Platform | undefined, userId: string, email: string) {
	const database = platform?.env?.DB;
	if (!database) throw new Error('D1 binding "DB" is unavailable.');

	const configuredEmails = (platform.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);
	if (configuredEmails.includes(email.toLowerCase())) return true;

	const [record] = await getDb(database)
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return record?.role === 'admin';
}
