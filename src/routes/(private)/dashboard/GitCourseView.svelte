<script lang="ts">
	import { onMount } from 'svelte';
	import { courseStore } from '$lib/gitcourse/stores/course.svelte';
	import { detectKind } from '$lib/gitcourse/renderers/detect';
	import BranchSelector from '$lib/gitcourse/components/BranchSelector.svelte';
	import CommitTimeline from '$lib/gitcourse/components/CommitTimeline.svelte';
	import FileExplorer from '$lib/gitcourse/components/FileExplorer.svelte';
	import ContentViewer from '$lib/gitcourse/components/ContentViewer.svelte';

	let { title, repoUrl }: { title: string; repoUrl: string } = $props();
	let kind = $derived(courseStore.selectedFile ? detectKind(courseStore.selectedFile) : null);
	let canDiff = $derived(kind !== null && kind !== 'image' && !!courseStore.previousCommitOid);

	onMount(() => {
		courseStore.load({ courseTitle: title, repoUrl });
	});
</script>

<div class="git-course">
	<header>
		<div class="repo-heading">
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><path
					d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
				/></svg
			>
			<div>
				<span>Repository course</span>
				<h1>{title}</h1>
			</div>
		</div>
		{#if courseStore.modules.length}<div class="repo-controls">
				<label
					><span>Diff vs previous</span><button
						type="button"
						role="switch"
						aria-label="Compare this file with the previous commit"
						disabled={!canDiff}
						aria-checked={courseStore.diffMode}
						onclick={() => courseStore.toggleDiffMode()}><i></i></button
					></label
				>
				<BranchSelector />
			</div>{/if}
	</header>
	{#if courseStore.loading}
		<div class="repo-state">
			<span class="repo-spinner"></span><strong>Cloning course repository…</strong>
			<p>This can take a moment on the first visit.</p>
		</div>
	{:else if courseStore.error}
		<div class="repo-state error" role="alert">
			<strong>We couldn’t open this repository.</strong>
			<p>{courseStore.error}</p>
			<button type="button" onclick={() => courseStore.load({ courseTitle: title, repoUrl })}
				>Try again</button
			>
		</div>
	{:else}
		<div class="repo-workspace"><CommitTimeline /><FileExplorer /><ContentViewer /></div>
	{/if}
</div>
