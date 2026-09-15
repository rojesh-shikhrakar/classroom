import { describe, expect, it } from 'vitest';
import { detectKind } from './detect';
import { joined, notebookLanguage, parseNotebook } from './notebook';

describe('Jupyter notebook rendering', () => {
	it('detects notebook filenames case-insensitively', () => {
		expect(detectKind('lessons/analysis.ipynb')).toBe('notebook');
		expect(detectKind('LESSON.IPYNB')).toBe('notebook');
	});

	it('parses a notebook and joins multiline sources', () => {
		const bytes = new TextEncoder().encode(
			JSON.stringify({ nbformat: 4, cells: [{ cell_type: 'code', source: ['x = 1\n', 'x'] }] })
		);
		const notebook = parseNotebook(bytes);
		expect(notebook.nbformat).toBe(4);
		expect(joined(notebook.cells[0].source)).toBe('x = 1\nx');
		expect(notebookLanguage(notebook)).toBe('python');
	});

	it('uses the notebook language metadata when available', () => {
		expect(
			notebookLanguage({
				nbformat: 4,
				cells: [],
				metadata: { language_info: { name: 'julia' } }
			})
		).toBe('julia');
	});

	it('rejects malformed and non-notebook JSON', () => {
		expect(() => parseNotebook(new TextEncoder().encode('{'))).toThrow('not valid JSON');
		expect(() => parseNotebook(new TextEncoder().encode('{}'))).toThrow('not a valid Jupyter');
	});
});
