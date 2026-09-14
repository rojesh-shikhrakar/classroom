<script lang="ts">
	import { courseStore } from '../stores/course.svelte';
	import { readFileBlob } from '../git/blobs';
	import { detectKind } from '../renderers/detect';
	import MarkdownRenderer from '../renderers/MarkdownRenderer.svelte';
	import CodeRenderer from '../renderers/CodeRenderer.svelte';
	import ImageRenderer from '../renderers/ImageRenderer.svelte';
	import DiffRenderer from '../renderers/DiffRenderer.svelte';

	let bytes = $state<Uint8Array | null>(null);
	let previousBytes = $state<Uint8Array | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	let kind = $derived(courseStore.selectedFile ? detectKind(courseStore.selectedFile) : null);
	let canDiff = $derived(kind !== null && kind !== 'image' && !!courseStore.previousCommitOid);

	$effect(() => {
		const commit = courseStore.selectedCommit;
		const file = courseStore.selectedFile;
		if (!commit || !file) {
			bytes = null;
			return;
		}
		let cancelled = false;
		loading = true;
		error = null;
		readFileBlob(commit, file)
			.then((r) => {
				if (!cancelled) bytes = r.blob;
			})
			.catch((e) => {
				if (!cancelled) error = e instanceof Error ? e.message : String(e);
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});
		return () => {
			cancelled = true;
		};
	});

	// Only fetched when diff mode is actually on — avoids doubling every file load.
	$effect(() => {
		const prev = courseStore.previousCommitOid;
		const file = courseStore.selectedFile;
		if (!courseStore.diffMode || !canDiff || !prev || !file) {
			previousBytes = null;
			return;
		}
		let cancelled = false;
		readFileBlob(prev, file)
			.then((r) => {
				if (!cancelled) previousBytes = r.blob;
			})
			.catch(() => {
				if (!cancelled) previousBytes = null; // file didn't exist yet — diff shows it as fully added
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#fffdf8]">
	<div class="p-6">
		{#if loading}
			<p class="text-sm text-[#667068]">Loading…</p>
		{:else if error}
			<p class="text-sm text-[#b13d27]">{error}</p>
		{:else if !courseStore.selectedFile}
			<p class="text-sm text-[#667068]">Select a file to view its content.</p>
		{:else if bytes}
			{#if courseStore.diffMode && canDiff}
				<DiffRenderer oldBytes={previousBytes} newBytes={bytes} path={courseStore.selectedFile} />
			{:else if kind === 'markdown'}
				<MarkdownRenderer
					{bytes}
					path={courseStore.selectedFile}
					commit={courseStore.selectedCommit}
				/>
			{:else if kind === 'image'}
				<ImageRenderer {bytes} path={courseStore.selectedFile} />
			{:else if kind === 'code'}
				<CodeRenderer {bytes} path={courseStore.selectedFile} />
			{:else}
				<CodeRenderer {bytes} path={courseStore.selectedFile} />
			{/if}
		{/if}
	</div>
</div>
