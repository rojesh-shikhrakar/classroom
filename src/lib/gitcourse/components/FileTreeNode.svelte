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
		class="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-[#35463a] hover:bg-[#ebe9df] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e46035]"
		class:bg-[#ebe9df]={node.type === 'blob' && node.path === courseStore.selectedFile}
		class:font-semibold={node.type === 'blob' && node.path === courseStore.selectedFile}
		onclick={toggle}
	>
		<span class="w-4 shrink-0 text-[#738078]">
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
