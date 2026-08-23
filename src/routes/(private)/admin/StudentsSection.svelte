<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		copied,
		onCopyCode
	}: { classroom: AdminClassroom; copied: boolean; onCopyCode: () => void } = $props();
</script>

<div class="title">
	<span>Students</span>
	<h2>People in your class.</h2>
	<p>Students join using <strong>{classroom.code}</strong>.</p>
</div>
<div class="card">
	<h3>{classroom.studentCount} students enrolled</h3>
	<p>Share the class code to invite more students.</p>
	<button type="button" class="secondary" onclick={onCopyCode}
		>{copied ? 'Code copied' : 'Copy invite code'}</button
	>
</div>
