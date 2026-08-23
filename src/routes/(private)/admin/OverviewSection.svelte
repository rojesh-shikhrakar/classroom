<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		itemCount,
		onOpenSetup
	}: { classroom: AdminClassroom; itemCount: number; onOpenSetup: () => void } = $props();
</script>

<div class="title">
	<span>Overview</span>
	<h2>Your class at a glance.</h2>
	<p>{classroom.description || 'Add a description in settings.'}</p>
</div>
<div class="stats">
	<article><strong>{classroom.modules.length}</strong><span>Modules</span></article>
	<article><strong>{itemCount}</strong><span>Content items</span></article>
	<article><strong>{classroom.studentCount}</strong><span>Students</span></article>
</div>
<div class="card row">
	<div>
		<small>Continue building</small>
		<h3>{classroom.modules.length ? 'Review your course content' : 'Create your first module'}</h3>
	</div>
	<button type="button" class="primary" onclick={onOpenSetup}>Open class setup</button>
</div>
