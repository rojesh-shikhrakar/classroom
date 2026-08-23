function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function safeUrl(value: string) {
	const url = value.trim();
	return url && !/^(?:javascript|data|vbscript):/i.test(url) ? escapeHtml(url) : '#';
}

function inlineMarkdown(value: string) {
	return escapeHtml(value)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(
			/!\[([^\]]*)\]\(([^\s)]+)(?:\s+[&quot;]([^&]*?)[&quot;])?\)/g,
			(_match, alt: string, url: string, title?: string) =>
				`<img src="${safeUrl(url)}" alt="${alt}"${title ? ` title="${title}"` : ''}>`
		)
		.replace(
			/\[([^\]]+)\]\(([^\s)]+)\)/g,
			(_match, label: string, url: string) =>
				`<a href="${safeUrl(url)}"${/^https?:\/\//i.test(url) ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`
		)
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
		.replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>');
}

export function renderMarkdown(markdown: string) {
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const output: string[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index += 1;
			continue;
		}

		const heading = line.match(/^(#{1,6})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length;
			output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
			index += 1;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const quote: string[] = [];
			while (index < lines.length && /^>\s?/.test(lines[index]))
				quote.push(lines[index++].replace(/^>\s?/, ''));
			output.push(`<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`);
			continue;
		}

		const list = line.match(/^\s*([-*+] |\d+\. )(.+)$/);
		if (list) {
			const ordered = /^\d/.test(list[1]);
			const tag = ordered ? 'ol' : 'ul';
			const items: string[] = [];
			const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
			while (index < lines.length) {
				const item = lines[index].match(pattern);
				if (!item) break;
				items.push(`<li>${inlineMarkdown(item[1])}</li>`);
				index += 1;
			}
			output.push(`<${tag}>${items.join('')}</${tag}>`);
			continue;
		}

		const paragraph = [line.trim()];
		index += 1;
		while (
			index < lines.length &&
			lines[index].trim() &&
			!/^(#{1,6})\s|^>\s?|^\s*([-*+] |\d+\. )/.test(lines[index])
		)
			paragraph.push(lines[index++].trim());
		output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
	}

	return output.join('\n');
}
