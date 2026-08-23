import { fail, redirect } from '@sveltejs/kit';
import {
	completeLesson,
	enrollUser,
	findClassroomByCode,
	getCompletedLessonIds,
	getLatestClassroomForUser,
	normalizeClassCode
} from '$lib/server/classrooms';
import type { Actions, PageServerLoad } from './$types';

function requireDatabase(platform: App.Platform | undefined) {
	const database = platform?.env?.DB;
	if (!database) throw new Error('D1 binding "DB" is unavailable.');
	return database;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const classroom = locals.user
		? await getLatestClassroomForUser(requireDatabase(platform), locals.user.id)
		: null;
	const completedLessonIds =
		locals.user && classroom
			? await getCompletedLessonIds(requireDatabase(platform), locals.user.id, classroom.id)
			: [];
	return { classroom, completedLessonIds };
};

export const actions: Actions = {
	joinClassroom: async ({ locals, platform, request }) => {
		if (!locals.user) redirect(303, '/login');

		const formData = await request.formData();
		const submittedCode = formData.get('code');
		if (typeof submittedCode !== 'string') {
			return fail(400, { code: '', error: 'Enter a class code.' });
		}

		const code = normalizeClassCode(submittedCode);
		if (!/^[A-Z0-9]{5,8}$/.test(code)) {
			return fail(400, {
				code,
				error: 'Enter the 5–8 character code shared by your instructor.'
			});
		}

		const database = requireDatabase(platform);
		const classroom = await findClassroomByCode(database, code);
		if (!classroom) {
			return fail(404, {
				code,
				error: 'We couldn’t find that class. Check the code and try again.'
			});
		}

		await enrollUser(database, locals.user.id, classroom.id);
		return { success: true, classroom };
	},
	completeLesson: async ({ locals, platform, request }) => {
		if (!locals.user) redirect(303, '/login');
		const formData = await request.formData();
		const lessonId = formData.get('lessonId');
		const classroomId = formData.get('classroomId');
		if (typeof lessonId !== 'string' || typeof classroomId !== 'string') {
			return fail(400, { completionError: 'The lesson could not be completed.' });
		}

		const database = requireDatabase(platform);
		const completed = await completeLesson(database, locals.user.id, classroomId, lessonId);
		if (!completed) return fail(403, { completionError: 'You do not have access to this lesson.' });

		return {
			completionSuccess: true,
			completedLessonId: lessonId,
			completedLessonIds: await getCompletedLessonIds(database, locals.user.id, classroomId)
		};
	},
	signOut: async ({ locals, request }) => {
		await locals.auth.api.signOut({ headers: request.headers });
		redirect(302, '/');
	}
};
