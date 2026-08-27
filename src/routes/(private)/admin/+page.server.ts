import { fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { isAdmin } from '$lib/server/admin';
import { normalizeClassCode } from '$lib/server/classrooms';
import { getDb } from '$lib/server/db';
import { classroom, classroomEnrollment, courseModule, lesson } from '$lib/server/db/schema';
import { user } from '$lib/server/db/auth.schema';
import type { AdminClassroom, AdminLesson } from '$lib/types/admin';
import type { Actions, PageServerLoad } from './$types';

function requireDatabase(platform: App.Platform | undefined) {
	const database = platform?.env?.DB;
	if (!database) throw new Error('D1 binding "DB" is unavailable.');
	return database;
}

async function requireAdmin(platform: App.Platform | undefined, user: App.Locals['user']) {
	if (!user) redirect(303, '/login');
	if (!(await isAdmin(platform, user.id, user.email))) redirect(303, '/dashboard');
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	await requireAdmin(platform, locals.user);
	const db = getDb(requireDatabase(platform));
	const [classRows, contentRows, enrollmentRows] = await Promise.all([
		db.select().from(classroom).orderBy(asc(classroom.createdAt)),
		db
			.select({ module: courseModule, lesson })
			.from(courseModule)
			.leftJoin(lesson, eq(lesson.moduleId, courseModule.id))
			.orderBy(asc(courseModule.position), asc(lesson.position)),
		db
			.select({
				classroomId: classroomEnrollment.classroomId,
				joinedAt: classroomEnrollment.joinedAt,
				student: { id: user.id, name: user.name, email: user.email }
			})
			.from(classroomEnrollment)
			.innerJoin(user, eq(user.id, classroomEnrollment.userId))
			.orderBy(asc(classroomEnrollment.joinedAt))
	]);

	const classes = new Map<string, AdminClassroom>();
	for (const room of classRows) {
		classes.set(room.id, {
			id: room.id,
			name: room.title,
			term: room.term,
			code: room.code,
			description: room.description,
			published: room.published,
			studentCount: 0,
			students: [],
			modules: []
		});
	}
	for (const enrollment of enrollmentRows) {
		const room = classes.get(enrollment.classroomId);
		if (!room) continue;
		room.students.push({
			...enrollment.student,
			joinedAt: enrollment.joinedAt.toISOString()
		});
		room.studentCount = room.students.length;
	}

	const modules = new Map<string, AdminClassroom['modules'][number]>();
	for (const row of contentRows) {
		let module = modules.get(row.module.id);
		if (!module) {
			module = {
				id: row.module.id,
				title: row.module.title,
				description: row.module.description,
				items: []
			};
			modules.set(row.module.id, module);
			classes.get(row.module.classroomId)?.modules.push(module);
		}
		if (row.lesson) {
			module.items.push({
				id: row.lesson.id,
				title: row.lesson.title,
				type:
					row.lesson.type === 'lab'
						? 'Activity'
						: row.lesson.type === 'project'
							? 'Project'
							: (`${row.lesson.type[0].toUpperCase()}${row.lesson.type.slice(1)}` as
									'Article' | 'Video' | 'Quiz'),
				details:
					row.lesson.details ||
					(row.lesson.durationMinutes ? `${row.lesson.durationMinutes} min` : ''),
				summary: row.lesson.summary,
				body: row.lesson.content.join('\n\n')
			});
		}
	}

	return { classes: [...classes.values()] };
};

function isLesson(value: unknown): value is AdminLesson {
	if (!value || typeof value !== 'object') return false;
	const item = value as Partial<AdminLesson>;
	return (
		typeof item.id === 'string' &&
		typeof item.title === 'string' &&
		['Article', 'Video', 'Activity', 'Project', 'Quiz'].includes(item.type ?? '') &&
		typeof item.details === 'string' &&
		typeof item.summary === 'string' &&
		typeof item.body === 'string'
	);
}

function isSavedClassroom(value: unknown): value is AdminClassroom {
	if (!value || typeof value !== 'object') return false;
	const room = value as Partial<AdminClassroom>;
	return (
		typeof room.id === 'string' &&
		typeof room.name === 'string' &&
		typeof room.term === 'string' &&
		typeof room.code === 'string' &&
		typeof room.description === 'string' &&
		typeof room.published === 'boolean' &&
		Array.isArray(room.modules) &&
		room.modules.every(
			(module) =>
				typeof module?.id === 'string' &&
				typeof module.title === 'string' &&
				typeof module.description === 'string' &&
				Array.isArray(module.items) &&
				module.items.every(isLesson)
		)
	);
}

function hasDuplicates(values: string[]) {
	return new Set(values).size !== values.length;
}

function durationFromDetails(details: string) {
	const match = details.match(/(?:^|\s)(\d+)\s*(?:min|minute)s?\b/i);
	return match ? Number.parseInt(match[1], 10) : 0;
}

export const actions: Actions = {
	removeStudent: async ({ locals, platform, request }) => {
		if (!locals.user) redirect(303, '/login');
		if (!(await isAdmin(platform, locals.user.id, locals.user.email))) {
			return fail(403, { error: 'You do not have permission to remove students.' });
		}

		const formData = await request.formData();
		const classroomId = formData.get('classroomId');
		const studentId = formData.get('studentId');
		if (
			typeof classroomId !== 'string' ||
			!classroomId ||
			typeof studentId !== 'string' ||
			!studentId
		) {
			return fail(400, { error: 'Classroom and student identifiers are required.' });
		}

		try {
			await getDb(requireDatabase(platform))
				.delete(classroomEnrollment)
				.where(
					and(
						eq(classroomEnrollment.classroomId, classroomId),
						eq(classroomEnrollment.userId, studentId)
					)
				);
		} catch (error) {
			console.error('Student removal failed', error);
			return fail(500, { error: 'The student could not be removed.' });
		}

		return { removed: true, classroomId, studentId };
	},
	deleteClassroom: async ({ locals, platform, request }) => {
		if (!locals.user) redirect(303, '/login');
		if (!(await isAdmin(platform, locals.user.id, locals.user.email))) {
			return fail(403, { error: 'You do not have permission to delete classrooms.' });
		}

		const classroomId = (await request.formData()).get('classroomId');
		if (typeof classroomId !== 'string' || !classroomId) {
			return fail(400, { error: 'Classroom identifier is missing.' });
		}

		const database = requireDatabase(platform);
		try {
			await getDb(database).delete(classroom).where(eq(classroom.id, classroomId));
		} catch (error) {
			console.error('Classroom deletion failed', error);
			return fail(500, { error: 'The class could not be deleted.' });
		}

		return { deleted: true, classroomId };
	},
	saveClassroom: async ({ locals, platform, request }) => {
		if (!locals.user) redirect(303, '/login');
		if (!(await isAdmin(platform, locals.user.id, locals.user.email))) {
			return fail(403, { error: 'You do not have permission to manage classrooms.' });
		}

		const raw = (await request.formData()).get('classroom');
		if (typeof raw !== 'string') return fail(400, { error: 'Classroom data is missing.' });

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Classroom data is invalid.' });
		}
		if (!isSavedClassroom(parsed)) return fail(400, { error: 'Classroom data is invalid.' });

		const room = parsed;
		const code = normalizeClassCode(room.code);
		if (!room.id || !room.name.trim() || !/^[A-Z0-9]{5,8}$/.test(code)) {
			return fail(400, { error: 'The class needs a name and a valid 5–8 character code.' });
		}
		if (
			room.modules.some(
				(module) => !module.title.trim() || module.items.some((item) => !item.title.trim())
			)
		) {
			return fail(400, { error: 'Every module and lesson needs a title.' });
		}
		const moduleIds = room.modules.map((module) => module.id);
		const lessonIds = room.modules.flatMap((module) => module.items.map((item) => item.id));
		if (
			!moduleIds.every(Boolean) ||
			!lessonIds.every(Boolean) ||
			hasDuplicates(moduleIds) ||
			hasDuplicates(lessonIds)
		) {
			return fail(400, { error: 'Course content contains duplicate or missing identifiers.' });
		}

		const database = requireDatabase(platform);
		const db = getDb(database);
		const existingModules = await db
			.select({ id: courseModule.id })
			.from(courseModule)
			.where(eq(courseModule.classroomId, room.id));
		const proposedModuleRows = moduleIds.length
			? await db
					.select({ id: courseModule.id, classroomId: courseModule.classroomId })
					.from(courseModule)
					.where(inArray(courseModule.id, moduleIds))
			: [];
		if (proposedModuleRows.some((module) => module.classroomId !== room.id)) {
			return fail(409, { error: 'A module identifier already belongs to another classroom.' });
		}

		const proposedLessonRows = lessonIds.length
			? await db
					.select({ id: lesson.id, classroomId: courseModule.classroomId })
					.from(lesson)
					.innerJoin(courseModule, eq(courseModule.id, lesson.moduleId))
					.where(inArray(lesson.id, lessonIds))
			: [];
		if (proposedLessonRows.some((item) => item.classroomId !== room.id)) {
			return fail(409, { error: 'A lesson identifier already belongs to another classroom.' });
		}

		const existingLessons = existingModules.length
			? await db
					.select({ id: lesson.id })
					.from(lesson)
					.where(
						inArray(
							lesson.moduleId,
							existingModules.map((module) => module.id)
						)
					)
			: [];
		const statements: D1PreparedStatement[] = [
			database
				.prepare(
					`INSERT INTO classroom (id, code, title, description, term, published, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT(id) DO UPDATE SET code = excluded.code, title = excluded.title,
					 description = excluded.description, term = excluded.term, published = excluded.published`
				)
				.bind(
					room.id,
					code,
					room.name.trim(),
					room.description.trim(),
					room.term.trim(),
					room.published ? 1 : 0,
					Date.now()
				)
		];

		for (const [index, module] of existingModules.entries()) {
			statements.push(
				database
					.prepare('UPDATE course_module SET position = ? WHERE id = ?')
					.bind(-index - 1, module.id)
			);
		}
		for (const [index, item] of existingLessons.entries()) {
			statements.push(
				database.prepare('UPDATE lesson SET position = ? WHERE id = ?').bind(-index - 1, item.id)
			);
		}

		for (const [moduleIndex, module] of room.modules.entries()) {
			statements.push(
				database
					.prepare(
						`INSERT INTO course_module (id, classroom_id, title, description, position)
						 VALUES (?, ?, ?, ?, ?)
						 ON CONFLICT(id) DO UPDATE SET title = excluded.title,
						 description = excluded.description, position = excluded.position`
					)
					.bind(module.id, room.id, module.title.trim(), module.description.trim(), moduleIndex + 1)
			);

			for (const [itemIndex, item] of module.items.entries()) {
				const type =
					item.type === 'Activity'
						? 'lab'
						: item.type === 'Project'
							? 'project'
							: item.type.toLowerCase();
				statements.push(
					database
						.prepare(
							`INSERT INTO lesson (id, module_id, title, type, summary, content, details, duration_minutes, position)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
							 ON CONFLICT(id) DO UPDATE SET module_id = excluded.module_id, title = excluded.title,
							 type = excluded.type, summary = excluded.summary, content = excluded.content,
							 details = excluded.details, duration_minutes = excluded.duration_minutes,
							 position = excluded.position`
						)
						.bind(
							item.id,
							module.id,
							item.title.trim(),
							type,
							item.summary.trim(),
							JSON.stringify(
								item.body
									.split(/\n\s*\n/)
									.map((part) => part.trim())
									.filter(Boolean)
							),
							item.details.trim(),
							durationFromDetails(item.details),
							itemIndex + 1
						)
				);
			}
		}

		for (const item of existingLessons.filter((item) => !lessonIds.includes(item.id))) {
			statements.push(database.prepare('DELETE FROM lesson WHERE id = ?').bind(item.id));
		}
		for (const module of existingModules.filter((module) => !moduleIds.includes(module.id))) {
			statements.push(database.prepare('DELETE FROM course_module WHERE id = ?').bind(module.id));
		}

		try {
			await database.batch(statements);
		} catch (error) {
			console.error('Classroom save failed', error);
			return fail(409, { error: 'The class could not be saved. Its code may already be in use.' });
		}
		return { saved: true, classroomId: room.id };
	}
};
