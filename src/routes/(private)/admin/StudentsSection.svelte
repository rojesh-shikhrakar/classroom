<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		copied,
		onCopyCode,
		onRemoveStudent
	}: {
		classroom: AdminClassroom;
		copied: boolean;
		onCopyCode: () => void;
		onRemoveStudent: (studentId: string, studentName: string) => void;
	} = $props();
</script>

<div class="title">
	<span>Students</span>
	<h2>People in your class.</h2>
	<p>Students join using <strong>{classroom.code}</strong>.</p>
</div>
{#if classroom.students.length}
	<div class="card student-list">
		<div class="student-list-head">
			<span>Student</span><span>Joined</span><span>Action</span>
		</div>
		{#each classroom.students as student (student.id)}
			<div class="student-row">
				<div class="student-identity">
					<span aria-hidden="true">{student.name.charAt(0).toUpperCase()}</span>
					<div><strong>{student.name}</strong><small>{student.email}</small></div>
				</div>
				<time datetime={student.joinedAt}
					>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
						new Date(student.joinedAt)
					)}</time
				>
				<button
					type="button"
					class="danger"
					onclick={() => onRemoveStudent(student.id, student.name)}>Remove</button
				>
			</div>
		{/each}
	</div>
{:else}
	<div class="card student-empty">
		<h3>No students yet</h3>
		<p>Share the invite code to get started.</p>
	</div>
{/if}
<div class="card">
	<h3>{classroom.studentCount} students enrolled</h3>
	<p>Share the class code to invite more students.</p>
	<button type="button" class="secondary" onclick={onCopyCode}
		>{copied ? 'Code copied' : 'Copy invite code'}</button
	>
</div>
