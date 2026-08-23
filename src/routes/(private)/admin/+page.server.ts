import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { classroom, courseModule, lesson } from '$lib/server/db/schema';
import { normalizeClassCode } from '$lib/server/classrooms';
import type { Actions, PageServerLoad } from './$types';

function requireDatabase(platform: App.Platform | undefined) {
	const database = platform?.env?.DB;
	if (!database) throw new Error('D1 binding "DB" is unavailable.');
	return database;
}

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(requireDatabase(platform));
	const classRows = await db.select().from(classroom).orderBy(asc(classroom.createdAt));
	const moduleRows = await db.select().from(courseModule).orderBy(asc(courseModule.position));
	const lessonRows = await db.select().from(lesson).orderBy(asc(lesson.position));

	return {
		classes: classRows.map((room) => ({
			id: room.id,
			name: room.title,
			term: '',
			code: room.code,
			description: room.description,
			published: true,
			modules: moduleRows
				.filter((module) => module.classroomId === room.id)
				.map((module) => ({
					id: module.id,
					title: module.title,
					description: module.description,
					items: lessonRows
						.filter((item) => item.moduleId === module.id)
						.map((item) => ({
							id: item.id,
							title: item.title,
							type:
								item.type === 'lab' || item.type === 'project'
									? ('Activity' as const)
									: (`${item.type[0].toUpperCase()}${item.type.slice(1)}` as
											'Article' | 'Video' | 'Quiz'),
							details: item.durationMinutes ? `${item.durationMinutes} min` : '',
							summary: item.summary,
							body: item.content.join('\n\n')
						}))
				}))
		}))
	};
};

type SavedClassroom = {
	id: string;
	name: string;
	code: string;
	description: string;
	modules: Array<{
		id: string;
		title: string;
		description: string;
		items: Array<{
			id: string;
			title: string;
			type: 'Article' | 'Video' | 'Activity' | 'Quiz';
			details: string;
			summary?: string;
			body?: string;
		}>;
	}>;
};

function isSavedClassroom(value: unknown): value is SavedClassroom {
	if (!value || typeof value !== 'object') return false;
	const item = value as Partial<SavedClassroom>;
	return (
		typeof item.id === 'string' &&
		typeof item.name === 'string' &&
		typeof item.code === 'string' &&
		typeof item.description === 'string' &&
		Array.isArray(item.modules)
	);
}

export const actions: Actions = {
	saveClassrooms: async ({ platform, request }) => {
		const formData = await request.formData();
		const raw = formData.get('classes');
		if (typeof raw !== 'string') return fail(400, { error: 'Classroom data is missing.' });

		let classes: unknown;
		try {
			classes = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Classroom data is invalid.' });
		}
		if (!Array.isArray(classes) || !classes.every(isSavedClassroom)) {
			return fail(400, { error: 'Classroom data is invalid.' });
		}

		const db = getDb(requireDatabase(platform));
		for (const room of classes) {
			const code = normalizeClassCode(room.code);
			if (!room.name.trim() || !/^[A-Z0-9]{5,8}$/.test(code)) {
				return fail(400, { error: 'Every class needs a name and a valid 5–8 character code.' });
			}

			await db
				.insert(classroom)
				.values({
					id: room.id,
					code,
					title: room.name.trim(),
					description: room.description.trim()
				})
				.onConflictDoUpdate({
					target: classroom.id,
					set: { code, title: room.name.trim(), description: room.description.trim() }
				});
			await db.delete(courseModule).where(eq(courseModule.classroomId, room.id));

			for (const [moduleIndex, module] of room.modules.entries()) {
				await db.insert(courseModule).values({
					id: module.id,
					classroomId: room.id,
					title: module.title.trim(),
					description: module.description.trim(),
					position: moduleIndex + 1
				});
				for (const [itemIndex, item] of module.items.entries()) {
					const duration = Number.parseInt(item.details, 10);
					await db.insert(lesson).values({
						id: item.id,
						moduleId: module.id,
						title: item.title.trim(),
						type:
							item.type === 'Activity'
								? 'lab'
								: (item.type.toLowerCase() as 'article' | 'video' | 'quiz'),
						summary: item.summary?.trim() ?? '',
						content:
							item.body
								?.split(/\n\s*\n/)
								.map((part) => part.trim())
								.filter(Boolean) ?? [],
						durationMinutes: Number.isNaN(duration) ? 0 : duration,
						position: itemIndex + 1
					});
				}
			}
		}

		return { saved: true };
	}
};
