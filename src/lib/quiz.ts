import type { QuizConfig, QuizQuestion, QuizResponse } from '$lib/types/quiz';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function isQuestionCorrect(question: QuizQuestion, response: QuizResponse | undefined) {
	const expected = question.answers.map(normalize).sort();
	const received = (Array.isArray(response) ? response : response ? [response] : [])
		.map(normalize)
		.sort();
	return (
		expected.length > 0 &&
		expected.length === received.length &&
		expected.every((v, i) => v === received[i])
	);
}

export function gradeQuiz(config: QuizConfig, responses: Record<string, QuizResponse>) {
	const total = config.questions.reduce((sum, question) => sum + question.points, 0);
	const earned = config.questions.reduce(
		(sum, question) =>
			sum + (isQuestionCorrect(question, responses[question.id]) ? question.points : 0),
		0
	);
	const percentage = total ? Math.round((earned / total) * 100) : 0;
	return { earned, total, percentage, passed: percentage >= config.passingScore };
}
