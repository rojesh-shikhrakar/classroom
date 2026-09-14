export type RendererKind = 'markdown' | 'code' | 'image' | 'text';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']);
const MD_EXT = new Set(['md', 'mdx']);
const CODE_LANG: Record<string, string> = {
	rs: 'rust',
	py: 'python',
	js: 'javascript',
	jsx: 'jsx',
	ts: 'typescript',
	tsx: 'tsx',
	svelte: 'svelte',
	go: 'go',
	java: 'java',
	c: 'c',
	cpp: 'cpp',
	json: 'json',
	yaml: 'yaml',
	yml: 'yaml',
	toml: 'toml',
	sh: 'bash'
};

const MIME: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	gif: 'image/gif'
};

function extOf(path: string): string {
	return path.split('.').pop()?.toLowerCase() ?? '';
}

export function detectKind(path: string): RendererKind {
	const ext = extOf(path);
	if (MD_EXT.has(ext)) return 'markdown';
	if (IMAGE_EXT.has(ext)) return 'image';
	if (ext in CODE_LANG) return 'code';
	return 'text';
}

export function langFor(path: string): string {
	return CODE_LANG[extOf(path)] ?? 'text';
}

export function mimeFor(path: string): string {
	return MIME[extOf(path)] ?? 'application/octet-stream';
}
