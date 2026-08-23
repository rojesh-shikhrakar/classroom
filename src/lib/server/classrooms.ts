import { and, asc, desc, eq } from 'drizzle-orm';
import type { ClassroomContent } from '$lib/types/classroom';
import { getDb } from './db';
import {
	classroom,
	classroomEnrollment,
	courseModule,
	lesson,
	lessonCompletion
} from './db/schema';

export function normalizeClassCode(code: string) {
	return code
		.trim()
		.replace(/[\s-]+/g, '')
		.toUpperCase();
}

async function getClassroomById(d1: D1Database, classroomId: string) {
	const db = getDb(d1);
	const [record] = await db.select().from(classroom).where(eq(classroom.id, classroomId)).limit(1);
	if (!record) return null;

	const rows = await db
		.select({ module: courseModule, lesson })
		.from(courseModule)
		.leftJoin(lesson, eq(lesson.moduleId, courseModule.id))
		.where(eq(courseModule.classroomId, record.id))
		.orderBy(asc(courseModule.position), asc(lesson.position));

	const modules = new Map<string, ClassroomContent['modules'][number]>();
	for (const row of rows) {
		let module = modules.get(row.module.id);
		if (!module) {
			module = { ...row.module, lessons: [] };
			modules.set(row.module.id, module);
		}
		if (row.lesson) module.lessons.push(row.lesson);
	}

	return { ...record, modules: [...modules.values()] } satisfies ClassroomContent;
}

export async function findClassroomByCode(d1: D1Database, rawCode: string) {
	const db = getDb(d1);
	const code = normalizeClassCode(rawCode);
	const [record] = await db
		.select({ id: classroom.id })
		.from(classroom)
		.where(eq(classroom.code, code))
		.limit(1);
	return record ? getClassroomById(d1, record.id) : null;
}

export async function getLatestClassroomForUser(d1: D1Database, userId: string) {
	const db = getDb(d1);
	const [record] = await db
		.select({ classroomId: classroomEnrollment.classroomId })
		.from(classroomEnrollment)
		.where(eq(classroomEnrollment.userId, userId))
		.orderBy(desc(classroomEnrollment.joinedAt))
		.limit(1);
	return record ? getClassroomById(d1, record.classroomId) : null;
}

export async function enrollUser(d1: D1Database, userId: string, classroomId: string) {
	const db = getDb(d1);
	await db
		.insert(classroomEnrollment)
		.values({ userId, classroomId })
		.onConflictDoUpdate({
			target: [classroomEnrollment.userId, classroomEnrollment.classroomId],
			set: { joinedAt: new Date() },
			where: and(
				eq(classroomEnrollment.userId, userId),
				eq(classroomEnrollment.classroomId, classroomId)
			)
		});
}

export async function getCompletedLessonIds(d1: D1Database, userId: string, classroomId: string) {
	const db = getDb(d1);
	const rows = await db
		.select({ lessonId: lessonCompletion.lessonId })
		.from(lessonCompletion)
		.innerJoin(lesson, eq(lesson.id, lessonCompletion.lessonId))
		.innerJoin(courseModule, eq(courseModule.id, lesson.moduleId))
		.where(and(eq(lessonCompletion.userId, userId), eq(courseModule.classroomId, classroomId)));
	return rows.map((row) => row.lessonId);
}

export async function completeLesson(
	d1: D1Database,
	userId: string,
	classroomId: string,
	lessonId: string
) {
	const db = getDb(d1);
	const [allowedLesson] = await db
		.select({ id: lesson.id })
		.from(lesson)
		.innerJoin(courseModule, eq(courseModule.id, lesson.moduleId))
		.innerJoin(
			classroomEnrollment,
			and(
				eq(classroomEnrollment.classroomId, courseModule.classroomId),
				eq(classroomEnrollment.userId, userId)
			)
		)
		.where(and(eq(lesson.id, lessonId), eq(courseModule.classroomId, classroomId)))
		.limit(1);
	if (!allowedLesson) return false;

	await db
		.insert(lessonCompletion)
		.values({ userId, lessonId })
		.onConflictDoNothing({ target: [lessonCompletion.userId, lessonCompletion.lessonId] });
	return true;
}
