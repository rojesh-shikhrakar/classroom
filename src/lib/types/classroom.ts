export type LessonContent = {
	id: string;
	title: string;
	type: 'article' | 'video' | 'quiz' | 'lab' | 'project';
	summary: string;
	content: string[];
	durationMinutes: number;
	position: number;
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
	published: boolean;
	modules: ModuleContent[];
};
