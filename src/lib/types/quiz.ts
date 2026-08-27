export type QuizQuestionType = 'mcq' | 'msq' | 'dropdown' | 'fill_blank';

export type QuizQuestion = {
	id: string;
	type: QuizQuestionType;
	prompt: string;
	options: string[];
	answers: string[];
	points: number;
};

export type QuizConfig = {
	passingScore: number;
	questions: QuizQuestion[];
};

export type QuizResponse = string | string[];
