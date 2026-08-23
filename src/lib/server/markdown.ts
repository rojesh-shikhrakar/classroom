import { compile } from 'mdsvex';

type MarkdownNode = {
	type?: string;
	value?: string;
	url?: string;
	children?: MarkdownNode[];
};

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function isSafeUrl(value: string) {
	const url = value.trim();
	if (!url) return false;
	return !/^(?:javascript|data|vbscript):/i.test(url);
}

/** Keep database-authored Markdown inert when mdsvex turns it into HTML. */
function sanitizeLessonMarkdown() {
	return (tree: MarkdownNode) => {
		function visit(node: MarkdownNode) {
			if (node.type === 'html' && node.value) {
				node.type = 'text';
				node.value = escapeHtml(node.value);
			}

			if ((node.type === 'link' || node.type === 'image') && node.url && !isSafeUrl(node.url)) {
				node.url = '#';
			}

			for (const child of node.children ?? []) visit(child);
		}

		visit(tree);
	};
}

export async function renderLessonMarkdown(markdown: string) {
	// The result is inserted with Svelte's `{@html}` directive, so it must be plain HTML.
	// mdsvex's default highlighter emits another `{@html}` directive for fenced code.
	const result = await compile(markdown, {
		highlight: false,
		remarkPlugins: [sanitizeLessonMarkdown]
	});
	return result?.code.trim() ?? '';
}
