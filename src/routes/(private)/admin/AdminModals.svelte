<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import type { AdminClassroom, AdminLesson, AdminModule } from '$lib/types/admin';
	import type { AdminModal } from './types';

	let {
		modal,
		activeClass,
		selectedModule,
		editingId,
		name = $bindable(),
		term = $bindable(),
		description = $bindable(),
		itemType = $bindable(),
		details = $bindable(),
		summary = $bindable(),
		body = $bindable(),
		cmsView = $bindable(),
		bodyField = $bindable(),
		closeModal,
		trapDialog,
		handleTabKey,
		insertBlock,
		submitClass,
		submitModule,
		submitItem,
		submitSettings
	}: {
		modal: AdminModal;
		activeClass: AdminClassroom;
		selectedModule?: AdminModule;
		editingId: string | null;
		name: string;
		term: string;
		description: string;
		itemType: AdminLesson['type'];
		details: string;
		summary: string;
		body: string;
		cmsView: 'write' | 'preview';
		bodyField?: HTMLTextAreaElement;
		closeModal: () => void;
		trapDialog: (node: HTMLElement) => { destroy(): void };
		handleTabKey: (event: KeyboardEvent) => void;
		insertBlock: (before: string, after?: string) => void;
		submitClass: (event: SubmitEvent) => void;
		submitModule: (event: SubmitEvent) => void;
		submitItem: (event: SubmitEvent) => void;
		submitSettings: (event: SubmitEvent) => void;
	} = $props();
</script>

{#if modal && modal !== 'preview'}<div
		class="backdrop"
		role="presentation"
		onclick={(e) => e.currentTarget === e.target && closeModal()}
	>
		<div
			class:cms={modal === 'content'}
			class="modal"
			use:trapDialog
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<button type="button" class="close" aria-label="Close" onclick={closeModal}>×</button>
			{#if modal === 'class'}<span>New classroom</span>
				<h2 id="dialog-title">Create a class</h2>
				<form onsubmit={submitClass}>
					<label
						>Class name<input required bind:value={name} placeholder="Introduction to AI" /></label
					><label>Term<input required bind:value={term} placeholder="Fall 2026" /></label><label
						>Description<textarea bind:value={description}></textarea></label
					><button class="primary" type="submit">Create class</button>
				</form>
			{:else if modal === 'module'}<span>Course structure</span>
				<h2 id="dialog-title">{editingId ? 'Edit module' : 'Add a module'}</h2>
				<form onsubmit={submitModule}>
					<label>Module title<input required bind:value={name} /></label><label
						>Description<textarea bind:value={description}></textarea></label
					><button class="primary" type="submit">{editingId ? 'Save changes' : 'Add module'}</button
					>
				</form>
			{:else if modal === 'content'}<form class="cms-form" onsubmit={submitItem}>
					<div class="cms-header">
						<div>
							<span>Content management system</span>
							<h2 id="dialog-title">{editingId ? 'Edit class content' : 'Create class content'}</h2>
						</div>
						<div class="cms-actions">
							<button type="button" class="secondary" onclick={closeModal}>Cancel</button><button
								class="primary"
								type="submit">Save content</button
							>
						</div>
					</div>
					<div class="cms-layout">
						<section class="cms-editor">
							<div class="cms-tabs" role="tablist" aria-label="Content editor view">
								<button
									id="write-tab"
									type="button"
									role="tab"
									aria-selected={cmsView === 'write'}
									aria-controls="write-panel"
									tabindex={cmsView === 'write' ? 0 : -1}
									class:active={cmsView === 'write'}
									onkeydown={handleTabKey}
									onclick={() => (cmsView = 'write')}>Write</button
								>
								<button
									id="preview-tab"
									type="button"
									role="tab"
									aria-selected={cmsView === 'preview'}
									aria-controls="preview-panel"
									tabindex={cmsView === 'preview' ? 0 : -1}
									class:active={cmsView === 'preview'}
									onkeydown={handleTabKey}
									onclick={() => (cmsView = 'preview')}>Preview</button
								>
							</div>
							{#if cmsView === 'write'}
								<div id="write-panel" role="tabpanel" aria-labelledby="write-tab">
									<label
										>Content title<input
											required
											bind:value={name}
											placeholder="Give this lesson a clear title"
										/></label
									>
									<label
										>Short summary<textarea
											class="summary-field"
											bind:value={summary}
											placeholder="What will students learn?"></textarea></label
									>
									<div class="body-label">
										<label for="content-body">Lesson content</label><span
											>{body.length} characters</span
										>
									</div>
									<div class="toolbar" aria-label="Formatting tools">
										<button type="button" title="Heading" onclick={() => insertBlock('## ')}
											>Heading</button
										>
										<button type="button" title="Bold" onclick={() => insertBlock('**', '**')}
											><b>Bold</b></button
										>
										<button type="button" title="Bullet list" onclick={() => insertBlock('- ')}
											>List</button
										>
										<button
											type="button"
											title="Link"
											onclick={() => insertBlock('[', '](https://)')}>Link</button
										>
										<button type="button" title="Callout" onclick={() => insertBlock('> ')}
											>Callout</button
										>
									</div>
									<textarea
										id="content-body"
										class="body-field"
										bind:this={bodyField}
										bind:value={body}
										placeholder="Write the lesson here. Use the toolbar for simple formatting."
									></textarea>
								</div>
							{:else}
								<div
									id="preview-panel"
									class="content-preview"
									role="tabpanel"
									aria-labelledby="preview-tab"
								>
									<span>{itemType}</span>
									<h1>{name || 'Untitled content'}</h1>
									{#if summary}<p class="lead">{summary}</p>{/if}
									<div class="preview-body">
										<!-- The local renderer escapes HTML and validates link protocols. -->
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html renderMarkdown(body || 'Start writing to preview your lesson content.')}
									</div>
								</div>
							{/if}
						</section>
						<aside class="cms-sidebar">
							<h3>Content settings</h3>
							<label
								>Content type<select bind:value={itemType}
									><option>Article</option><option>Video</option><option>Activity</option><option
										>Project</option
									><option>Quiz</option></select
								></label
							>
							<label
								>{itemType === 'Quiz' ? 'Quiz setup' : 'Duration or details'}<input
									required
									bind:value={details}
									placeholder={itemType === 'Quiz' ? '8 questions · 70% to pass' : '12 min'}
								/></label
							>
							<div class="cms-location">
								<span>Location</span><strong>{selectedModule?.title}</strong><small
									>{activeClass.name}</small
								>
							</div>
							<div class="cms-status">
								<span></span>
								<div>
									<strong>Draft content</strong><small>Save your changes before leaving.</small>
								</div>
							</div>
						</aside>
					</div>
				</form>
			{:else}<span>Class details</span>
				<h2 id="dialog-title">Edit settings</h2>
				<form onsubmit={submitSettings}>
					<label>Class name<input required bind:value={name} /></label><label
						>Term<input bind:value={term} /></label
					><label>Description<textarea bind:value={description}></textarea></label><button
						class="primary"
						type="submit">Save settings</button
					>
				</form>{/if}
		</div>
	</div>
{:else if modal === 'preview'}<div class="backdrop">
		<div
			class="modal preview"
			role="dialog"
			aria-modal="true"
			aria-labelledby="preview-title"
			use:trapDialog
		>
			<button type="button" class="close" aria-label="Close" onclick={closeModal}>×</button><span
				>Student preview</span
			>
			<h2 id="preview-title">{activeClass.name}</h2>
			<p>{activeClass.description}</p>
			{#each activeClass.modules as module, index (module.id)}<article>
					<strong>{index + 1}. {module.title}</strong><small
						>{module.items.length} learning items</small
					>
				</article>{/each}
		</div>
	</div>{/if}
