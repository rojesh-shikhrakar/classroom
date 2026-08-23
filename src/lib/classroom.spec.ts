import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';
import { normalizeClassCode } from './server/classrooms';

describe('classroom helpers', () => {
	it('normalizes classroom codes consistently', () => {
		expect(normalizeClassCode(' ai-20 26 ')).toBe('AI2026');
	});

	it('escapes lesson HTML and rejects unsafe link protocols', () => {
		const rendered = renderMarkdown('<script>alert(1)</script> [bad](javascript:alert(1))');
		expect(rendered).toContain('&lt;script&gt;');
		expect(rendered).toContain('href="#"');
		expect(rendered).not.toContain('<script>');
	});
});
