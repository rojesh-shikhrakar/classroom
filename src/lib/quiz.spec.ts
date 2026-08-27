import { describe, expect, it } from 'vitest';
import { gradeQuiz } from './quiz';

describe('gradeQuiz', () => {
	it('grades all supported response shapes case-insensitively', () => {
		const result = gradeQuiz(
			{
				passingScore: 70,
				questions: [
					{
						id: 'a',
						type: 'mcq',
						prompt: 'A',
						options: ['Yes', 'No'],
						answers: ['Yes'],
						points: 1
					},
					{
						id: 'b',
						type: 'msq',
						prompt: 'B',
						options: ['X', 'Y'],
						answers: ['X', 'Y'],
						points: 2
					},
					{ id: 'c', type: 'fill_blank', prompt: 'C', options: [], answers: ['Model'], points: 1 }
				]
			},
			{ a: 'Yes', b: ['Y', 'X'], c: ' model ' }
		);
		expect(result).toEqual({ earned: 4, total: 4, percentage: 100, passed: true });
	});
});
