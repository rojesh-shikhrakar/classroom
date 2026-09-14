import type { QuizConfig } from '$lib/types/quiz';

export type LessonContent = {
	id: string;
	title: string;
	type: 'article' | 'video' | 'quiz' | 'lab' | 'project';
	summary: string;
	content: string[];
	renderedContent?: string;
	durationMinutes: number;
	position: number;
	quiz?: QuizConfig;
};

export type ModuleContent = {
	id: string;
	title: string;
	description: string;
	position: number;
	lessons: LessonContent[];
};

export type ClassroomContent = {
	id: string;
	code: string;
	title: string;
	description: string;
	term: string;
	courseType: 'lessons' | 'repository';
	repoUrl: string;
	published: boolean;
	modules: ModuleContent[];
};
