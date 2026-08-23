import { describe, expect, it, vi } from 'vitest';
import { completeLesson } from './classrooms';

describe('completeLesson', () => {
	it('joins the classroom table when checking access to a published lesson', async () => {
		const queries: string[] = [];
		const database = {
			prepare: vi.fn((query: string) => {
				queries.push(query);
				return {
					bind: vi.fn(() => ({
						raw: async () => [['lesson-1']],
						run: async () => ({ success: true })
					}))
				};
			})
		} as unknown as D1Database;

		await expect(completeLesson(database, 'user-1', 'classroom-1', 'lesson-1')).resolves.toBe(true);
		expect(queries[0]).toContain('inner join "classroom"');
		expect(queries).toHaveLength(2);
	});
});
