<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import DOMPurify from 'dompurify';
	import { readFileBlob } from '../git/blobs';
	import { mimeFor } from './detect';

	let { bytes, path, commit }: { bytes: Uint8Array; path: string; commit: string } = $props();

	const md = new MarkdownIt({ html: false, linkify: true });

	let html = $state('');

	function resolvePath(base: string, rel: string): string {
		const baseDir = base.split('/').slice(0, -1);
		for (const part of rel.split('/')) {
			if (part === '' || part === '.') continue;
			if (part === '..') baseDir.pop();
			else baseDir.push(part);
		}
		return baseDir.join('/');
	}

	function isExternal(src: string): boolean {
		return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) || src.startsWith('data:');
	}

	$effect(() => {
		let cancelled = false;
		const objectUrls: string[] = [];

		(async () => {
			const text = new TextDecoder('utf-8').decode(bytes);
			const tokens = md.parse(text, {});
			const imageSrcs = new Set<string>();
			const collect = (toks: ReturnType<typeof md.parse>) => {
				for (const t of toks) {
					if (t.type === 'image') {
						const src = t.attrGet('src');
						if (src) imageSrcs.add(String(src));
					}
					if (t.children) collect(t.children);
				}
			};
			collect(tokens);

			// Resolve repo-relative image paths to blob URLs; leave external URLs alone.
			const srcMap = new Map<string, string>();
			await Promise.all(
				[...imageSrcs]
					.filter((src) => !isExternal(src))
					.map(async (src) => {
						try {
							const resolved = resolvePath(path, src);
							const { blob } = await readFileBlob(commit, resolved);
							const url = URL.createObjectURL(
								new Blob([blob as BlobPart], { type: mimeFor(resolved) })
							);
							objectUrls.push(url);
							srcMap.set(src, url);
						} catch {
							// broken/missing image link — leave the original (dead) src
						}
					})
			);

			const defaultImageRule =
				md.renderer.rules.image ??
				((toks, idx, options, _env, self) => self.renderToken(toks, idx, options));
			md.renderer.rules.image = (toks, idx, options, env, self) => {
				const token = toks[idx];
				const src = token.attrGet('src');
				const key = src != null ? String(src) : undefined;
				if (key && srcMap.has(key)) token.attrSet('src', srcMap.get(key)!);
				return defaultImageRule(toks, idx, options, env, self);
			};

			const raw = md.render(text);
			if (!cancelled) html = DOMPurify.sanitize(raw);
		})();

		return () => {
			cancelled = true;
			objectUrls.forEach((u) => URL.revokeObjectURL(u));
		};
	});
</script>

<article class="prose max-w-none prose-neutral dark:prose-invert">
	{@html html}
</article>
