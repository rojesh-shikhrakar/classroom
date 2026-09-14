<script lang="ts">
	import type { FileNode } from '../course/model';
	import { courseStore } from '../stores/course.svelte';
	import FileTreeNode from './FileTreeNode.svelte';

	let { node, depth = 0 }: { node: FileNode; depth?: number } = $props();
	let expanded = $state(false);

	async function toggle() {
		if (node.type === 'tree') {
			if (!expanded) await courseStore.expandDir(node);
			expanded = !expanded;
		} else {
			courseStore.selectFile(node.path);
		}
	}
</script>

<div style="padding-left: {depth * 14}px">
	<button
		class="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
		class:bg-neutral-100={node.type === 'blob' && node.path === courseStore.selectedFile}
		class:dark:bg-neutral-800={node.type === 'blob' && node.path === courseStore.selectedFile}
		onclick={toggle}
	>
		<span class="w-4 shrink-0 text-neutral-400">
			{node.type === 'tree' ? (expanded ? '▾' : '▸') : '📄'}
		</span>
		<span class="truncate">{node.name}</span>
	</button>
	{#if node.type === 'tree' && expanded && node.children}
		{#each node.children as child (child.path)}
			<FileTreeNode node={child} depth={depth + 1} />
		{/each}
	{/if}
</div>
