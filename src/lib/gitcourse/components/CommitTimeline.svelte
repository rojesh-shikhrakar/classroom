<script lang="ts">
	import { courseStore } from '../stores/course.svelte';
</script>

{#if courseStore.commitPanelOpen}
	<div class="flex w-56 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
		<div
			class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800"
		>
			<span>Commits</span>
			<button
				class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
				onclick={() => courseStore.toggleCommitPanel()}
				aria-label="Collapse commits"
			>
				⟨
			</button>
		</div>
		<ol class="flex-1 overflow-y-auto py-2">
			{#each [...courseStore.sections].reverse() as section (section.oid)}
				<li>
					<button
						class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
						class:bg-neutral-100={section.oid === courseStore.selectedCommit}
						class:dark:bg-neutral-800={section.oid === courseStore.selectedCommit}
						onclick={() => courseStore.selectCommit(section.oid)}
					>
						<span class="mt-1.5 size-2 shrink-0 rounded-full bg-neutral-400"></span>
						<span>
							<div class="font-medium">{section.title}</div>
							{#if section.subtitle}
								<div class="text-xs text-neutral-500">{section.subtitle}</div>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ol>
	</div>
{:else}
	<button
		class="w-6 shrink-0 border-r border-neutral-200 text-neutral-400 hover:text-neutral-700 dark:border-neutral-800 dark:hover:text-neutral-200"
		onclick={() => courseStore.toggleCommitPanel()}
		aria-label="Expand commits"
	>
		⟩
	</button>
{/if}
