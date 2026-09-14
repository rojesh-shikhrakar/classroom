/** "01-introduction" -> "Introduction" */
export function branchTitle(name: string): string {
	const cleaned = name
		.replace(/^\d+[-_.]?/, '')
		.replace(/[-_]+/g, ' ')
		.trim();
	const title = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
	return title || name;
}

/** First line of a commit message is the title, the rest is the subtitle. */
export function splitCommitMessage(message: string): { title: string; subtitle?: string } {
	const [title, ...rest] = message.trim().split('\n');
	const subtitle = rest.join(' ').trim();
	return { title: title.trim(), subtitle: subtitle || undefined };
}
