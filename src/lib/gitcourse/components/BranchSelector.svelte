<script lang="ts">
	import { courseStore } from '../stores/course.svelte';

	function onChange(e: Event) {
		courseStore.selectBranch((e.target as HTMLSelectElement).value);
	}
</script>

<select
	class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
	value={courseStore.selectedBranch}
	onchange={onChange}
>
	{#each courseStore.modules as mod (mod.name)}
		<option value={mod.name}>{mod.title}</option>
	{/each}
</select>
