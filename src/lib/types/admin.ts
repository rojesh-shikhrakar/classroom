export type AdminLesson = {
	id: string;
	title: string;
	type: 'Article' | 'Video' | 'Activity' | 'Project' | 'Quiz';
	details: string;
	summary: string;
	body: string;
};

export type AdminModule = {
	id: string;
	title: string;
	description: string;
	items: AdminLesson[];
};

export type AdminStudent = {
	id: string;
	name: string;
	email: string;
	joinedAt: string;
};

export type AdminClassroom = {
	id: string;
	name: string;
	term: string;
	code: string;
	description: string;
	published: boolean;
	studentCount: number;
	students: AdminStudent[];
	modules: AdminModule[];
};
