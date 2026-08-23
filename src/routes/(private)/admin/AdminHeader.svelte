<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		onOpenNavigation,
		onPreview,
		onTogglePublished
	}: {
		classroom: AdminClassroom;
		onOpenNavigation: () => void;
		onPreview: () => void;
		onTogglePublished: () => void;
	} = $props();
</script>

<header>
	<button type="button" class="menu" aria-label="Open navigation" onclick={onOpenNavigation}
		>☰</button
	>
	<div>
		<p>{classroom.term || 'No term'} · Active class</p>
		<h1>{classroom.name}</h1>
	</div>
	<div class="actions">
		<button disabled={!classroom.id} type="button" class="secondary" onclick={onPreview}
			>Preview as student</button
		><button type="button" class="primary" disabled={!classroom.id} onclick={onTogglePublished}
			>{classroom.published ? 'Published ✓' : 'Publish class'}</button
		>
	</div>
</header>
