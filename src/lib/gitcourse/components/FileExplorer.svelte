<script lang="ts">
	import { courseStore } from '../stores/course.svelte';
	import FileTreeNode from './FileTreeNode.svelte';
</script>

{#if courseStore.filePanelOpen}
	<div class="flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
		<div
			class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800"
		>
			<span>Files</span>
			<button
				class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
		class="w-6 shrink-0 border-r border-neutral-200 text-neutral-400 hover:text-neutral-700 dark:border-neutral-800 dark:hover:text-neutral-200"
		onclick={() => courseStore.toggleFilePanel()}
		aria-label="Expand files"
	>
		⟩
	</button>
{/if}
