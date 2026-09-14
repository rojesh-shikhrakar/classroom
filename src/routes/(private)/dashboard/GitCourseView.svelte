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
	let repositoryTitle = $derived(
		repoUrl
			.replace(/\.git\/?$/, '')
			.split('/')
			.filter(Boolean)
			.at(-1) ?? title
	);

	onMount(() => {
		courseStore.load({ courseTitle: title, repoUrl });
	});
</script>

<div class="git-course">
	<header>
		<h1>{repositoryTitle}</h1>
		{#if courseStore.modules.length}
			<div class="repo-controls">
				<label
					><span>Content</span><button
						type="button"
						role="switch"
						aria-label="Compare this file with the previous commit"
						disabled={!canDiff}
						aria-checked={courseStore.diffMode}
						onclick={() => courseStore.toggleDiffMode()}><i aria-hidden="true"></i></button
					><span>Diff</span></label
				>
				<BranchSelector />
			</div>
		{/if}
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
