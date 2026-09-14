export interface CourseConfig {
	repoUrl: string;
	defaultBranch?: string;
	courseTitle: string;
	/** isomorphic-git needs a CORS proxy to talk to GitHub from the browser. */
	corsProxy?: string;
}

export interface CourseModule {
	name: string; // raw branch name, e.g. "01-introduction"
	title: string; // display name, e.g. "Introduction"
}

export interface CourseSection {
	oid: string;
	title: string;
	subtitle?: string;
}

export interface FileNode {
	name: string;
	path: string;
	type: 'blob' | 'tree';
	oid: string;
	children?: FileNode[];
}
