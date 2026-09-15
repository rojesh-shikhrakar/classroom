<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { courseStore } from '$lib/gitcourse/stores/course.svelte';
	import { detectKind } from '$lib/gitcourse/renderers/detect';
	import BranchSelector from '$lib/gitcourse/components/BranchSelector.svelte';
	import CommitTimeline from '$lib/gitcourse/components/CommitTimeline.svelte';
	import FileExplorer from '$lib/gitcourse/components/FileExplorer.svelte';
	import ContentViewer from '$lib/gitcourse/components/ContentViewer.svelte';

	let {
		title,
		classroomId,
		repoUrl,
		userName
	}: { title: string; classroomId: string; repoUrl: string; userName: string } = $props();
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
		<div class="repo-controls">
			{#if courseStore.modules.length}
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
			{/if}
			<details class="git-account-menu">
				<summary aria-label={`Open profile menu for ${userName}`}>
					<span aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
				</summary>
				<div class="git-account-submenu">
					<div class="git-account-copy"><strong>{userName}</strong><small>Student</small></div>
					<form method="post" action="?/leaveClassroom" use:enhance>
						<input type="hidden" name="classroomId" value={classroomId} />
						<button type="submit" class="git-exit-course-button">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M4 5h10v14H4zM14 12h6m-3-3 3 3-3 3" />
							</svg>
							Exit course
						</button>
					</form>
					<form method="post" action="?/signOut">
						<button type="submit" class="git-logout-button">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M10 17l5-5-5-5M4 12h11M15 4h4v16h-4" />
							</svg>
							Log out
						</button>
					</form>
				</div>
			</details>
		</div>
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
