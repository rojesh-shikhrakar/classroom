export interface NotebookOutput {
	output_type?: string;
	name?: string;
	text?: string | string[];
	data?: Record<string, unknown>;
	traceback?: string[];
}

export interface NotebookCell {
	cell_type?: string;
	source?: string | string[];
	execution_count?: number | null;
	outputs?: NotebookOutput[];
}

export interface Notebook {
	nbformat: number;
	cells: NotebookCell[];
	metadata?: {
		kernelspec?: { language?: string };
		language_info?: { name?: string };
	};
}

export function notebookLanguage(notebook: Notebook): string {
	return (
		notebook.metadata?.language_info?.name ?? notebook.metadata?.kernelspec?.language ?? 'python'
	);
}

export function joined(value: unknown): string {
	if (Array.isArray(value))
		return value.filter((part): part is string => typeof part === 'string').join('');
	return typeof value === 'string' ? value : '';
}

export function parseNotebook(bytes: Uint8Array): Notebook {
	let parsed: unknown;
	try {
		parsed = JSON.parse(new TextDecoder('utf-8').decode(bytes));
	} catch {
		throw new Error('This notebook is not valid JSON.');
	}

	if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Notebook).cells)) {
		throw new Error('This file is not a valid Jupyter notebook.');
	}

	return parsed as Notebook;
}
