import { describe, expect, it } from 'vitest';
import { renderLessonMarkdown } from './markdown';

describe('lesson Markdown', () => {
	it('renders lists and images through mdsvex', async () => {
		const rendered = await renderLessonMarkdown(
			'## Materials\n\n- Notebook\n- Pencil\n\n![A diagram](/images/diagram.png)'
		);

		expect(rendered).toContain('<h2>Materials</h2>');
		expect(rendered).toContain('<ul>');
		expect(rendered).toContain('<li>Notebook</li>');
		expect(rendered).toContain('<img src="/images/diagram.png" alt="A diagram">');
	});

	it('renders fenced code as plain HTML', async () => {
		const rendered = await renderLessonMarkdown('```ts\nconst answer = 42;\n```');

		expect(rendered).toContain('<pre><code class="language-ts">');
		expect(rendered).toContain('const answer = 42;');
		expect(rendered).not.toContain('{@html');
	});

	it('escapes raw HTML and rejects executable URLs', async () => {
		const rendered = await renderLessonMarkdown(
			'<script>alert(1)</script>\n\n![bad](javascript:alert(1))'
		);

		expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(rendered).toContain('src="#"');
		expect(rendered).not.toContain('<script>');
	});
});
