<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import DOMPurify from 'dompurify';
	import { diffArrays } from 'diff';
	import { readFileBlob } from '../git/blobs';
	import { mimeFor } from './detect';

	let {
		oldBytes,
		newBytes,
		path,
		oldCommit,
		newCommit
	}: {
		oldBytes: Uint8Array | null;
		newBytes: Uint8Array;
		path: string;
		oldCommit: string | undefined;
		newCommit: string;
	} = $props();

	type RenderedBlock = { key: string; html: string };
	type DiffBlock = RenderedBlock & { kind: 'unchanged' | 'addition' | 'deletion' };

	const md = new MarkdownIt({ html: false, linkify: true });
	type MarkdownToken = ReturnType<typeof md.parse>[number];
	let blocks = $state<DiffBlock[]>([]);

	function resolvePath(base: string, relative: string): string {
		const parts = base.split('/').slice(0, -1);
		for (const part of relative.split('/')) {
			if (!part || part === '.') continue;
			if (part === '..') parts.pop();
			else parts.push(part);
		}
		return parts.join('/');
	}

	function isExternal(src: string): boolean {
		return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) || src.startsWith('data:');
	}

	function tokenKey(token: MarkdownToken): unknown {
		return {
			type: token.type,
			tag: token.tag,
			nesting: token.nesting,
			attrs: token.attrs,
			content: token.content,
			markup: token.markup,
			info: token.info,
			children: token.children?.map(tokenKey)
		};
	}

	function groupTopLevelTokens(tokens: MarkdownToken[]): MarkdownToken[][] {
		const groups: MarkdownToken[][] = [];
		let group: MarkdownToken[] = [];
		let depth = 0;

		for (const token of tokens) {
			group.push(token);
			depth += token.nesting;
			if (depth === 0) {
				groups.push(group);
				group = [];
			}
		}
		if (group.length) groups.push(group);
		return groups;
	}

	async function renderBlocks(
		bytes: Uint8Array | null,
		commit: string | undefined,
		objectUrls: string[]
	): Promise<RenderedBlock[]> {
		if (!bytes) return [];
		const text = new TextDecoder('utf-8').decode(bytes);
		const tokens = md.parse(text, {});
		const keys = groupTopLevelTokens(tokens).map((group) => JSON.stringify(group.map(tokenKey)));
		const imageTokens: MarkdownToken[] = [];

		const collectImages = (items: MarkdownToken[]) => {
			for (const token of items) {
				if (token.type === 'image') imageTokens.push(token);
				if (token.children) collectImages(token.children);
			}
		};
		collectImages(tokens);

		if (commit) {
			await Promise.all(
				imageTokens.map(async (token) => {
					const attribute = token.attrGet('src');
					const src = attribute == null ? '' : String(attribute);
					if (!src || isExternal(src)) return;
					try {
						const resolved = resolvePath(path, src);
						const { blob } = await readFileBlob(commit, resolved);
						const url = URL.createObjectURL(
							new Blob([blob as BlobPart], { type: mimeFor(resolved) })
						);
						objectUrls.push(url);
						token.attrSet('src', url);
					} catch {
						// Preserve the original URL when the referenced image is unavailable.
					}
				})
			);
		}

		return groupTopLevelTokens(tokens).map((group, index) => ({
			key: keys[index],
			html: DOMPurify.sanitize(md.renderer.render(group, md.options, {}))
		}));
	}

	$effect(() => {
		let cancelled = false;
		const objectUrls: string[] = [];

		Promise.all([
			renderBlocks(oldBytes, oldCommit, objectUrls),
			renderBlocks(newBytes, newCommit, objectUrls)
		]).then(([oldBlocks, newBlocks]) => {
			if (cancelled) {
				objectUrls.forEach((url) => URL.revokeObjectURL(url));
				return;
			}
			blocks = diffArrays(oldBlocks, newBlocks, {
				comparator: (oldBlock, newBlock) => oldBlock.key === newBlock.key
			}).flatMap((change) =>
				change.value.map((block) => ({
					...block,
					kind: change.added ? 'addition' : change.removed ? 'deletion' : 'unchanged'
				}))
			);
		});

		return () => {
			cancelled = true;
			objectUrls.forEach((url) => URL.revokeObjectURL(url));
		};
	});
</script>

<article
	class="markdown-diff prose max-w-none prose-neutral"
	aria-label={`Rendered changes to ${path}`}
>
	{#each blocks as block, index (`${block.kind}-${block.key}-${index}`)}
		{#if block.kind === 'unchanged'}
			<div class="markdown-diff-block unchanged">{@html block.html}</div>
		{:else}
			<section
				class:added={block.kind === 'addition'}
				class:removed={block.kind === 'deletion'}
				class="markdown-diff-block changed"
				aria-label={block.kind === 'addition' ? 'Added content' : 'Removed content'}
			>
				<span class="change-marker" aria-hidden="true">{block.kind === 'addition' ? '+' : '−'}</span
				>
				{@html block.html}
			</section>
		{/if}
	{/each}
</article>

<style>
	.markdown-diff-block {
		position: relative;
	}
	.changed {
		margin-block: 0.5rem;
		padding: 0.25rem 1rem 0.25rem 1.5rem;
		border-left: 3px solid;
		border-radius: 0 0.4rem 0.4rem 0;
	}
	.added {
		border-color: #2f7d4a;
		background: #e6f4ea;
	}
	.removed {
		border-color: #b5473a;
		background: #fbe9e7;
		text-decoration-color: #b5473a;
	}
	.change-marker {
		position: absolute;
		top: 0.45rem;
		left: 0.45rem;
		font-weight: 800;
		line-height: 1;
	}
	.added .change-marker {
		color: #216e39;
	}
	.removed .change-marker {
		color: #9f3025;
	}
	:global(.markdown-diff-block > :first-child) {
		margin-top: 0;
	}
	:global(.markdown-diff-block > :last-child) {
		margin-bottom: 0;
	}
	:global(.markdown-diff-block.removed > *) {
		opacity: 0.82;
		text-decoration: line-through;
	}
</style>
