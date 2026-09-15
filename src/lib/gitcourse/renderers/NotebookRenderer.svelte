<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import DOMPurify from 'dompurify';
	import { joined, notebookLanguage, parseNotebook, type Notebook } from './notebook';

	let { bytes }: { bytes: Uint8Array } = $props();

	const markdown = new MarkdownIt({ html: false, linkify: true });
	let notebook = $state<Notebook | null>(null);
	let error = $state<string | null>(null);
	let highlighted = $state<Record<number, string>>({});
	let rendered = $state<Record<number, boolean>>({});
	let renderGeneration = 0;
	let highlightQueue = Promise.resolve();

	type IdleWindow = Window & {
		requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
	};

	function yieldToBrowser(): Promise<void> {
		return new Promise((resolve) => {
			const idleWindow = window as IdleWindow;
			if (idleWindow.requestIdleCallback) {
				idleWindow.requestIdleCallback(resolve, { timeout: 200 });
			} else {
				setTimeout(resolve, 0);
			}
		});
	}

	function queueHighlight(
		cell: Notebook['cells'][number],
		index: number,
		generation: number
	): void {
		if (cell.cell_type !== 'code' || highlighted[index] !== undefined) return;

		highlightQueue = highlightQueue.then(async () => {
			await yieldToBrowser();
			if (generation !== renderGeneration || !notebook) return;

			try {
				const { codeToHtml } = await import('shiki');
				const html = await codeToHtml(joined(cell.source), {
					lang: notebookLanguage(notebook),
					theme: 'github-dark'
				});
				if (generation === renderGeneration) highlighted[index] = html;
			} catch {
				// The escaped source fallback remains available if syntax highlighting cannot load.
			}
		});
	}

	function renderWhenNear(node: HTMLElement, index: number) {
		if (rendered[index]) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				rendered[index] = true;
				const cell = notebook?.cells[index];
				if (cell) queueHighlight(cell, index, renderGeneration);
				observer.disconnect();
			},
			{ rootMargin: '800px 0px' }
		);
		observer.observe(node);

		return { destroy: () => observer.disconnect() };
	}

	function escape(text: string): string {
		return text.replace(
			/[<>&]/g,
			(character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[character]!
		);
	}

	function markdownHtml(source: unknown): string {
		return DOMPurify.sanitize(markdown.render(joined(source)));
	}

	function safeHtml(value: unknown): string {
		return DOMPurify.sanitize(joined(value));
	}

	function imageSource(mime: string, value: unknown): string {
		return `data:${mime};base64,${joined(value).replace(/\s/g, '')}`;
	}

	function encodedImageSource(mime: string, value: unknown): string {
		const bytes = new TextEncoder().encode(joined(value));
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return `data:${mime};base64,${btoa(binary)}`;
	}

	$effect(() => {
		notebook = null;
		error = null;
		highlighted = {};
		rendered = {};
		const generation = ++renderGeneration;

		try {
			notebook = parseNotebook(bytes);
		} catch (reason) {
			error = reason instanceof Error ? reason.message : String(reason);
			return;
		}

		return () => {
			if (generation === renderGeneration) renderGeneration++;
		};
	});
</script>

{#if error}
	<div
		class="rounded-lg border border-[#e2b7ad] bg-[#fff2ef] p-4 text-sm text-[#9f3522]"
		role="alert"
	>
		{error}
	</div>
{:else if notebook}
	<div class="notebook" aria-label="Jupyter notebook">
		{#each notebook.cells as cell, index (index)}
			<section
				class="cell"
				class:cell-placeholder={!rendered[index]}
				class:raw-cell={cell.cell_type === 'raw'}
				use:renderWhenNear={index}
			>
				{#if !rendered[index]}
					<span class="sr-only">Notebook cell loading</span>
				{:else if cell.cell_type === 'markdown'}
					<article class="markdown-cell prose max-w-none prose-neutral">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- DOMPurify sanitizes rendered Markdown. -->
						{@html markdownHtml(cell.source)}
					</article>
				{:else if cell.cell_type === 'code'}
					<div class="cell-row">
						<div class="prompt">In [{cell.execution_count ?? ' '}]:</div>
						<div class="code overflow-x-auto rounded-lg text-sm">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- Shiki output or the escaped fallback is trusted. -->
							{@html highlighted[index] ?? `<pre><code>${escape(joined(cell.source))}</code></pre>`}
						</div>
					</div>

					{#each cell.outputs ?? [] as output, outputIndex (outputIndex)}
						<div class="cell-row output-row">
							<div class="prompt">
								{output.output_type === 'execute_result'
									? `Out[${cell.execution_count ?? ' '}]:`
									: ''}
							</div>
							<div class="output overflow-x-auto">
								{#if output.output_type === 'error'}
									<pre class="error-output">{(output.traceback ?? []).join('\n')}</pre>
								{:else if output.data?.['image/png']}
									<img
										src={imageSource('image/png', output.data['image/png'])}
										alt="Notebook output"
									/>
								{:else if output.data?.['image/jpeg']}
									<img
										src={imageSource('image/jpeg', output.data['image/jpeg'])}
										alt="Notebook output"
									/>
								{:else if output.data?.['image/svg+xml']}
									<img
										src={encodedImageSource('image/svg+xml', output.data['image/svg+xml'])}
										alt="Notebook output"
									/>
								{:else if output.data?.['text/html']}
									<div class="html-output">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -- DOMPurify sanitizes notebook HTML output. -->
										{@html safeHtml(output.data['text/html'])}
									</div>
								{:else}
									<pre>{joined(output.text ?? output.data?.['text/plain'])}</pre>
								{/if}
							</div>
						</div>
					{/each}
				{:else}
					<pre class="raw">{joined(cell.source)}</pre>
				{/if}
			</section>
		{/each}
	</div>
{/if}

<style>
	.notebook {
		display: flex;
		width: 100%;
		min-width: 0;
		flex-direction: column;
	}
	.cell {
		width: 100%;
		min-width: 0;
		background: #fff;
		padding: 0.2rem 0;
		border-bottom: 1px solid #e8e5dc;
	}
	.markdown-cell {
		width: 100%;
		padding-top: 2rem;
		padding-left: 3rem;
		padding-right: 3rem;
		padding-bottom: 2rem;
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.markdown-cell :global(> :first-child) {
		margin-top: 0;
	}
	.markdown-cell :global(> :last-child) {
		margin-bottom: 0;
	}
	.markdown-cell :global(p),
	.markdown-cell :global(ul),
	.markdown-cell :global(ol),
	.markdown-cell :global(h1),
	.markdown-cell :global(h2),
	.markdown-cell :global(h3) {
		width:90%;	
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}
	.cell-placeholder {
		min-height: 3rem;
		background: #f8f7f3;
	}
	.cell-row {
		display: grid;
		grid-template-columns: 4.5rem minmax(0, 1fr);
		gap: 0.5rem;
	}
	.prompt {
		padding-top: 0.75rem;
		color: #9f3522;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		text-align: right;
	}
	.output-row {
		margin-top: 0.75rem;
	}
	.code :global(pre) {
		margin: 0;
		min-width: max-content;
		padding: 0.75rem;
	}
	.code {
		width: 100%;
		min-width: 0;
		background: #24292e;
	}
	.code > :global(pre) {
		background: #24292e;
		color: #f6f8fa;
		white-space: pre;
	}
	.output pre,
	.raw {
		margin: 0;
		white-space: pre-wrap;
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
	}
	.output img {
		max-width: 100%;
		height: auto;
	}
	.error-output {
		color: #b13d27;
	}
	.raw-cell {
		background: #f4f1e8;
	}
	@media (max-width: 640px) {
		.cell-row {
			grid-template-columns: 1fr;
		}
		.prompt {
			padding-top: 0;
			text-align: left;
		}
	}
</style>
