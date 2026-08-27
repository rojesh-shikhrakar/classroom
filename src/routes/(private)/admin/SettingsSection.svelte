<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		onEdit,
		onDelete
	}: { classroom: AdminClassroom; onEdit: () => void; onDelete: () => void } = $props();
</script>

<div class="title">
	<span>Settings</span>
	<h2>Class settings.</h2>
	<p>Manage the class identity and publishing state.</p>
</div>
<div class="card settings">
	<dl>
		<div>
			<dt>Class name</dt>
			<dd>{classroom.name}</dd>
		</div>
		<div>
			<dt>Term</dt>
			<dd>{classroom.term || 'Not set'}</dd>
		</div>
		<div>
			<dt>Class code</dt>
			<dd>{classroom.code}</dd>
		</div>
		<div>
			<dt>Status</dt>
			<dd>{classroom.published ? 'Published' : 'Draft'}</dd>
		</div>
	</dl>
	<button type="button" class="primary" onclick={onEdit}>Edit settings</button>
</div>
<div class="card danger-zone">
	<div>
		<h3>Delete class</h3>
		<p>Permanently delete this class, including all modules, content, enrollments, and progress.</p>
	</div>
	<button type="button" class="danger" onclick={onDelete}>Delete class</button>
</div>
