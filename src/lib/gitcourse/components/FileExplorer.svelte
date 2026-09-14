<script lang="ts">
	import { courseStore } from '../stores/course.svelte';
	import FileTreeNode from './FileTreeNode.svelte';
</script>

{#if courseStore.filePanelOpen}
	<div class="flex w-64 shrink-0 flex-col border-r border-[#d9d8ce] bg-[#fffdf8]">
		<div
			class="flex items-center justify-between border-b border-[#d9d8ce] px-3 py-2 text-xs font-bold tracking-wider text-[#667068] uppercase"
		>
			<span>Files</span>
			<button
				class="rounded text-[#737b74] hover:text-[#173e29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e46035]"
				onclick={() => courseStore.toggleFilePanel()}
				aria-label="Collapse files"
			>
				⟨
			</button>
		</div>
		<div class="flex-1 overflow-y-auto p-2">
			{#each courseStore.tree as node (node.path)}
				<FileTreeNode {node} />
			{/each}
		</div>
	</div>
{:else}
	<button
		class="flex w-9 shrink-0 items-center justify-center gap-2 border-r border-[#d9d8ce] bg-[#fffdf8] py-3 text-xs font-bold tracking-wider text-[#667068] uppercase hover:bg-[#ebe9df] hover:text-[#173e29] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e46035]"
		onclick={() => courseStore.toggleFilePanel()}
		aria-label="Expand files"
	>
		<span class="rotate-180 [writing-mode:vertical-rl]">Files</span>
		<span aria-hidden="true">⟩</span>
	</button>
{/if}
