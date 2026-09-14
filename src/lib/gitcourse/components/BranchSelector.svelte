<script lang="ts">
	import { courseStore } from '../stores/course.svelte';

	function onChange(e: Event) {
		courseStore.selectBranch((e.target as HTMLSelectElement).value);
	}
</script>

<select
	aria-label="Course branch"
	class="rounded-lg border border-[#c9cbc1] bg-[#fffdf8] px-3 py-2 text-sm font-semibold text-[#173e29] shadow-sm outline-none focus:border-[#173e29] focus:ring-2 focus:ring-[#e46035]/35"
	value={courseStore.selectedBranch}
	onchange={onChange}
>
	{#each courseStore.modules as mod (mod.name)}
		<option value={mod.name}>{mod.title}</option>
	{/each}
</select>
