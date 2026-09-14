<script lang="ts">
	import { structuredPatch } from 'diff';

	let {
		oldBytes,
		newBytes,
		path
	}: { oldBytes: Uint8Array | null; newBytes: Uint8Array; path: string } = $props();

	type DiffRow = {
		kind: 'context' | 'addition' | 'deletion' | 'meta';
		oldNumber?: number;
		newNumber?: number;
		marker: string;
		content: string;
	};

	let rows = $state<DiffRow[]>([]);

	$effect(() => {
		const oldText = oldBytes ? new TextDecoder('utf-8').decode(oldBytes) : '';
		const newText = new TextDecoder('utf-8').decode(newBytes);
		const patch = structuredPatch(
			path,
			path,
			oldText,
			newText,
			oldBytes ? 'previous commit' : 'added',
			'this commit'
		);
		const nextRows: DiffRow[] = [];
		for (const hunk of patch.hunks) {
			nextRows.push({
				kind: 'meta',
				marker: '',
				content: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
			});
			let oldNumber = hunk.oldStart;
			let newNumber = hunk.newStart;
			for (const line of hunk.lines) {
				const marker = line[0] ?? ' ';
				if (marker === '+') {
					nextRows.push({
						kind: 'addition',
						newNumber: newNumber++,
						marker,
						content: line.slice(1)
					});
				} else if (marker === '-') {
					nextRows.push({
						kind: 'deletion',
						oldNumber: oldNumber++,
						marker,
						content: line.slice(1)
					});
				} else if (marker === ' ') {
					nextRows.push({
						kind: 'context',
						oldNumber: oldNumber++,
						newNumber: newNumber++,
						marker: '',
						content: line.slice(1)
					});
				} else {
					nextRows.push({ kind: 'meta', marker: '', content: line });
				}
			}
		}
		rows = nextRows;
	});
</script>

<div class="diff-table overflow-x-auto rounded-lg text-sm" aria-label={`Changes to ${path}`}>
	<div class="diff-code" role="table">
		{#each rows as row}
			<div
				class:addition={row.kind === 'addition'}
				class:deletion={row.kind === 'deletion'}
				class:meta={row.kind === 'meta'}
				class="diff-row"
				role="row"
			>
				<span
					class="line-number"
					aria-label={row.oldNumber ? `Old line ${row.oldNumber}` : undefined}
					>{row.oldNumber ?? ''}</span
				>
				<span
					class="line-number"
					aria-label={row.newNumber ? `New line ${row.newNumber}` : undefined}
					>{row.newNumber ?? ''}</span
				>
				<span class="marker" aria-hidden="true">{row.marker}</span>
				<code>{row.content || ' '}</code>
			</div>
		{/each}
	</div>
</div>

<style>
	.diff-table {
		background: #0d1117;
		color: #e6edf3;
	}
	.diff-code {
		width: max-content;
		min-width: 100%;
		padding: 1rem 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		line-height: 1.5;
	}
	.diff-row {
		display: grid;
		grid-template-columns: 3.25rem 3.25rem 2rem minmax(max-content, 1fr);
		min-height: 1.5rem;
	}
	.line-number {
		padding: 0 0.75rem;
		border-right: 1px solid #30363d;
		color: #8b949e;
		font-variant-numeric: tabular-nums;
		text-align: right;
		user-select: none;
	}
	.marker {
		text-align: center;
		user-select: none;
	}
	.diff-row code {
		padding-right: 1rem;
		white-space: pre;
	}
	.addition {
		background: #12261e;
	}
	.addition .marker {
		color: #3fb950;
	}
	.deletion {
		background: #2d1619;
	}
	.deletion .marker {
		color: #f85149;
	}
	.meta {
		background: #101d2d;
		color: #79c0ff;
	}
</style>
