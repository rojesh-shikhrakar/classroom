<script lang="ts">
	import { courseStore } from '../stores/course.svelte';
</script>

{#if courseStore.commitPanelOpen}
	<div class="flex w-56 shrink-0 flex-col border-r border-[#d9d8ce] bg-[#f8f6ef]">
		<div
			class="flex items-center justify-between border-b border-[#d9d8ce] px-3 py-2 text-xs font-bold tracking-wider text-[#667068] uppercase"
		>
			<span>Progression</span>
			<button
				class="rounded text-[#737b74] hover:text-[#173e29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e46035]"
				onclick={() => courseStore.toggleCommitPanel()}
				aria-label="Collapse progression"
			>
				⟨
			</button>
		</div>
		<ol class="flex-1 overflow-y-auto py-2">
			{#each [...courseStore.sections].reverse() as section (section.oid)}
				<li>
					<button
						class="flex w-full items-start gap-2 border-l-2 border-transparent px-3 py-2 text-left text-sm text-[#35463a] hover:bg-[#ebe9df] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e46035]"
						class:border-[#e46035]={section.oid === courseStore.selectedCommit}
						class:bg-[#ebe9df]={section.oid === courseStore.selectedCommit}
						onclick={() => courseStore.selectCommit(section.oid)}
					>
						<span class="mt-1.5 size-2 shrink-0 rounded-full bg-[#738078]"></span>
						<span>
							<div class="font-medium">{section.title}</div>
							{#if section.subtitle}
								<div class="text-xs text-[#737b74]">{section.subtitle}</div>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ol>
	</div>
{:else}
	<button
		class="flex w-9 shrink-0 items-center justify-center gap-2 border-r border-[#d9d8ce] bg-[#f8f6ef] py-3 text-xs font-bold tracking-wider text-[#667068] uppercase hover:bg-[#ebe9df] hover:text-[#173e29] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e46035]"
		onclick={() => courseStore.toggleCommitPanel()}
		aria-label="Expand progression"
	>
		<span class="rotate-180 [writing-mode:vertical-rl]">Progression</span>
		<span aria-hidden="true">⟩</span>
	</button>
{/if}
