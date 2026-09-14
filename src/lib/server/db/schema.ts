import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const classroom = sqliteTable(
	'classroom',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		code: text('code').notNull(),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		term: text('term').notNull().default(''),
		courseType: text('course_type', { enum: ['lessons', 'repository'] })
			.notNull()
			.default('lessons'),
		repoUrl: text('repo_url').notNull().default(''),
		published: integer('published', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [uniqueIndex('classroom_code_uidx').on(table.code)]
);

export const courseModule = sqliteTable(
	'course_module',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		classroomId: text('classroom_id')
			.notNull()
			.references(() => classroom.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		position: integer('position').notNull()
	},
	(table) => [
		index('course_module_classroom_idx').on(table.classroomId),
		uniqueIndex('course_module_position_uidx').on(table.classroomId, table.position)
	]
);

export const lesson = sqliteTable(
	'lesson',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		moduleId: text('module_id')
			.notNull()
			.references(() => courseModule.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		type: text('type', { enum: ['article', 'video', 'quiz', 'lab', 'project'] })
			.notNull()
			.default('article'),
		summary: text('summary').notNull().default(''),
		content: text('content', { mode: 'json' }).$type<string[]>().notNull().default([]),
		details: text('details').notNull().default(''),
		durationMinutes: integer('duration_minutes').notNull().default(0),
		quiz: text('quiz', { mode: 'json' }).$type<import('$lib/types/quiz').QuizConfig | null>(),
		position: integer('position').notNull()
	},
	(table) => [
		index('lesson_module_idx').on(table.moduleId),
		uniqueIndex('lesson_position_uidx').on(table.moduleId, table.position)
	]
);

export const classroomEnrollment = sqliteTable(
	'classroom_enrollment',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		classroomId: text('classroom_id')
			.notNull()
			.references(() => classroom.id, { onDelete: 'cascade' }),
		joinedAt: integer('joined_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex('classroom_enrollment_uidx').on(table.userId, table.classroomId),
		index('classroom_enrollment_user_idx').on(table.userId)
	]
);

export const lessonCompletion = sqliteTable(
	'lesson_completion',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		lessonId: text('lesson_id')
			.notNull()
			.references(() => lesson.id, { onDelete: 'cascade' }),
		completedAt: integer('completed_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex('lesson_completion_uidx').on(table.userId, table.lessonId),
		index('lesson_completion_user_idx').on(table.userId)
	]
);

export * from './auth.schema';
