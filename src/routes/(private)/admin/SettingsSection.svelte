<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let { classroom, onEdit }: { classroom: AdminClassroom; onEdit: () => void } = $props();
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
