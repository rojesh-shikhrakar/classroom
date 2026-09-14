<script lang="ts">
	import { langFor } from './detect';

	let { bytes, path }: { bytes: Uint8Array; path: string } = $props();

	let html = $state('');

	function escape(text: string): string {
		return text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
	}

	$effect(() => {
		let cancelled = false;
		const text = new TextDecoder('utf-8').decode(bytes);

		(async () => {
			try {
				const { codeToHtml } = await import('shiki');
				const out = await codeToHtml(text, { lang: langFor(path), theme: 'github-dark' });
				if (!cancelled) html = out;
			} catch {
				if (!cancelled) html = `<pre class="shiki"><code>${escape(text)}</code></pre>`;
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
