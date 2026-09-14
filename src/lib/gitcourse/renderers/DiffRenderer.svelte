<script lang="ts">
	import { createTwoFilesPatch } from 'diff';

	let {
		oldBytes,
		newBytes,
		path
	}: { oldBytes: Uint8Array | null; newBytes: Uint8Array; path: string } = $props();

	let html = $state('');

	function escape(text: string): string {
		return text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
	}

	$effect(() => {
		let cancelled = false;
		const oldText = oldBytes ? new TextDecoder('utf-8').decode(oldBytes) : '';
		const newText = new TextDecoder('utf-8').decode(newBytes);
		const patch = createTwoFilesPatch(
			path,
			path,
			oldText,
			newText,
			oldBytes ? 'previous commit' : 'added',
			'this commit'
		);

		(async () => {
			try {
				const { codeToHtml } = await import('shiki');
				const out = await codeToHtml(patch, { lang: 'diff', theme: 'github-dark' });
				if (!cancelled) html = out;
			} catch {
				if (!cancelled) html = `<pre class="shiki"><code>${escape(patch)}</code></pre>`;
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="code-body overflow-x-auto rounded-lg text-sm [&_pre]:p-4">
	{@html html}
</div>
