<script lang="ts">
	import { untrack } from 'svelte';
	import { renderMarkdown } from '$lib/markdown';
	import type { PageData } from './$types';

	type Item = {
		id: string;
		title: string;
		type: 'Article' | 'Video' | 'Activity' | 'Quiz';
		details: string;
		summary?: string;
		body?: string;
	};
	type Module = { id: string; title: string; description: string; items: Item[] };
	type Classroom = {
		id: string;
		name: string;
		term: string;
		code: string;
		description: string;
		published: boolean;
		modules: Module[];
	};
	type Modal = 'class' | 'module' | 'content' | 'settings' | 'preview' | null;

	let { data }: { data: PageData } = $props();
	let section = $state<'overview' | 'setup' | 'students' | 'settings'>('setup');
	let modal = $state<Modal>(null);
	let mobileOpen = $state(false);
	let activeId = $state('');
	let selectedId = $state('');
	let editingId = $state<string | null>(null);
	let copied = $state(false);
	let notice = $state('');
	let name = $state('');
	let term = $state('');
	let description = $state('');
	let itemType = $state<Item['type']>('Article');
	let details = $state('');
	let summary = $state('');
	let body = $state('');
	let cmsView = $state<'write' | 'preview'>('write');
	let bodyField = $state<HTMLTextAreaElement>();

	let classes = $state<Classroom[]>([]);
	let saveQueue = Promise.resolve();
	const initialClasses = untrack(() => data.classes);
	classes = initialClasses;
	activeId = initialClasses[0]?.id ?? '';
	selectedId = initialClasses[0]?.modules[0]?.id ?? '';

	const activeClass = $derived(classes.find((c) => c.id === activeId) ?? classes[0]);
	const selectedModule = $derived(
		activeClass.modules.find((m) => m.id === selectedId) ?? activeClass.modules[0]
	);
	const itemCount = $derived(activeClass.modules.reduce((sum, m) => sum + m.items.length, 0));

	function persist(next: Classroom[]) {
		classes = next;
		const snapshot = JSON.stringify(next);
		saveQueue = saveQueue
			.catch(() => undefined)
			.then(async () => {
				const formData = new FormData();
				formData.set('classes', snapshot);
				try {
					const response = await fetch('?/saveClassrooms', { method: 'POST', body: formData });
					if (!response.ok) flash('Could not save class changes');
				} catch {
					flash('Could not save class changes');
				}
			});
	}
	function updateClass(fn: (value: Classroom) => Classroom) {
		persist(classes.map((c) => (c.id === activeId ? fn(c) : c)));
	}
	function flash(message: string) {
		notice = message;
		setTimeout(() => (notice = ''), 2000);
	}
	function switchClass() {
		selectedId = activeClass.modules[0]?.id ?? '';
	}
	function openClass() {
		editingId = null;
		name = '';
		term = '';
		description = '';
		modal = 'class';
	}
	function openModule(value?: Module) {
		editingId = value?.id ?? null;
		name = value?.title ?? '';
		description = value?.description ?? '';
		modal = 'module';
	}
	function openItem(value?: Item, forceQuiz = false) {
		editingId = value?.id ?? null;
		name = value?.title ?? '';
		itemType = forceQuiz ? 'Quiz' : (value?.type ?? 'Article');
		details = value?.details ?? '';
		summary = value?.summary ?? '';
		body = value?.body ?? '';
		cmsView = 'write';
		modal = 'content';
	}
	function insertBlock(before: string, after = '') {
		const start = bodyField?.selectionStart ?? body.length;
		const end = bodyField?.selectionEnd ?? body.length;
		const selected = body.slice(start, end);
		body = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
		requestAnimationFrame(() => {
			bodyField?.focus();
			bodyField?.setSelectionRange(start + before.length, end + before.length);
		});
	}
	function openSettings() {
		name = activeClass.name;
		term = activeClass.term;
		description = activeClass.description;
		modal = 'settings';
	}

	function submitClass(event: SubmitEvent) {
		event.preventDefault();
		const id = crypto.randomUUID();
		const code =
			`${name.replace(/[^a-z0-9]/gi, '').slice(0, 3)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
		persist([
			...classes,
			{
				id,
				name: name.trim(),
				term: term.trim(),
				code,
				description: description.trim(),
				published: false,
				modules: []
			}
		]);
		activeId = id;
		selectedId = '';
		section = 'setup';
		modal = null;
		flash('Class created');
	}
	function submitModule(event: SubmitEvent) {
		event.preventDefault();
		const id = editingId ?? crypto.randomUUID();
		updateClass((c) => ({
			...c,
			modules: editingId
				? c.modules.map((m) =>
						m.id === id ? { ...m, title: name.trim(), description: description.trim() } : m
					)
				: [...c.modules, { id, title: name.trim(), description: description.trim(), items: [] }]
		}));
		selectedId = id;
		modal = null;
		flash(editingId ? 'Module updated' : 'Module added');
	}
	function submitItem(event: SubmitEvent) {
		event.preventDefault();
		if (!selectedModule) return;
		const id = editingId ?? crypto.randomUUID();
		updateClass((c) => ({
			...c,
			modules: c.modules.map((m) =>
				m.id === selectedModule.id
					? {
							...m,
							items: editingId
								? m.items.map((i) =>
										i.id === id
											? {
													...i,
													title: name.trim(),
													type: itemType,
													details: details.trim(),
													summary: summary.trim(),
													body: body.trim()
												}
											: i
									)
								: [
										...m.items,
										{
											id,
											title: name.trim(),
											type: itemType,
											details: details.trim(),
											summary: summary.trim(),
											body: body.trim()
										}
									]
						}
					: m
			)
		}));
		modal = null;
		flash(editingId ? 'Content updated' : `${itemType} added`);
	}
	function submitSettings(event: SubmitEvent) {
		event.preventDefault();
		updateClass((c) => ({
			...c,
			name: name.trim(),
			term: term.trim(),
			description: description.trim()
		}));
		modal = null;
		flash('Settings saved');
	}
	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= activeClass.modules.length) return;
		updateClass((c) => {
			const modules = [...c.modules];
			[modules[index], modules[target]] = [modules[target], modules[index]];
			return { ...c, modules };
		});
		flash('Module order updated');
	}
	function removeModule() {
		if (!selectedModule || !confirm(`Delete “${selectedModule.title}” and all its content?`))
			return;
		const nextId = activeClass.modules.find((m) => m.id !== selectedModule.id)?.id ?? '';
		updateClass((c) => ({ ...c, modules: c.modules.filter((m) => m.id !== selectedModule.id) }));
		selectedId = nextId;
		flash('Module deleted');
	}
	async function copyCode() {
		await navigator.clipboard?.writeText(activeClass.code);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}
</script>

<svelte:head><title>Admin workspace — Northstar AI</title></svelte:head>

<div class="shell">
	{#if mobileOpen}<button
			type="button"
			class="scrim"
			aria-label="Close navigation"
			onclick={() => (mobileOpen = false)}
		></button>{/if}
	<aside class:open={mobileOpen}>
		<a class="brand" href="/admin"
			><span class="mark">N</span><span>Northstar <strong>AI</strong></span></a
		>
		<p class="label">Instructor workspace</p>
		<nav>
			{#each [{ id: 'overview', text: 'Overview' }, { id: 'setup', text: 'Class setup' }, { id: 'students', text: 'Students' }, { id: 'settings', text: 'Settings' }] as item}
				<button
					type="button"
					class:active={section === item.id}
					onclick={() => {
						section = item.id as typeof section;
						mobileOpen = false;
					}}>{item.text}</button
				>
			{/each}
		</nav>
		<div class="switcher">
			<label for="class-select">Active class</label><select
				id="class-select"
				bind:value={activeId}
				onchange={switchClass}
				>{#each classes as c}<option value={c.id}>{c.name}</option>{/each}</select
			><button type="button" onclick={openClass}>+ Create new class</button>
		</div>
		<div class="profile">
			<span>{data.user.name.charAt(0).toUpperCase()}</span>
			<div><strong>{data.user.name}</strong><small>Instructor</small></div>
		</div>
	</aside>

	<main>
		<header>
			<button
				type="button"
				class="menu"
				aria-label="Open navigation"
				onclick={() => (mobileOpen = true)}>☰</button
			>
			<div>
				<p>{activeClass.term || 'No term'} · Active class</p>
				<h1>{activeClass.name}</h1>
			</div>
			<div class="actions">
				<button type="button" class="secondary" onclick={() => (modal = 'preview')}
					>Preview as student</button
				><button
					type="button"
					class="primary"
					onclick={() => {
						updateClass((c) => ({ ...c, published: !c.published }));
						flash(activeClass.published ? 'Class unpublished' : 'Class published');
					}}>{activeClass.published ? 'Published ✓' : 'Publish class'}</button
				>
			</div>
		</header>
		{#if notice}<div class="toast" role="status">{notice}</div>{/if}
		<section class="content">
			{#if section === 'overview'}
				<div class="title">
					<span>Overview</span>
					<h2>Your class at a glance.</h2>
					<p>{activeClass.description || 'Add a description in settings.'}</p>
				</div>
				<div class="stats">
					<article><strong>{activeClass.modules.length}</strong><span>Modules</span></article>
					<article><strong>{itemCount}</strong><span>Content items</span></article>
					<article><strong>18</strong><span>Students</span></article>
				</div>
				<div class="card row">
					<div>
						<small>Continue building</small>
						<h3>
							{activeClass.modules.length
								? 'Review your course content'
								: 'Create your first module'}
						</h3>
					</div>
					<button type="button" class="primary" onclick={() => (section = 'setup')}
						>Open class setup</button
					>
				</div>
			{:else if section === 'students'}
				<div class="title">
					<span>Students</span>
					<h2>People in your class.</h2>
					<p>Students join using <strong>{activeClass.code}</strong>.</p>
				</div>
				<div class="card">
					<h3>18 students enrolled</h3>
					<p>Share the class code to invite more students.</p>
					<button type="button" class="secondary" onclick={copyCode}
						>{copied ? 'Code copied' : 'Copy invite code'}</button
					>
				</div>
			{:else if section === 'settings'}
				<div class="title">
					<span>Settings</span>
					<h2>Class settings.</h2>
					<p>Manage the class identity and publishing state.</p>
				</div>
				<div class="card settings">
					<dl>
						<div>
							<dt>Class name</dt>
							<dd>{activeClass.name}</dd>
						</div>
						<div>
							<dt>Term</dt>
							<dd>{activeClass.term || 'Not set'}</dd>
						</div>
						<div>
							<dt>Class code</dt>
							<dd>{activeClass.code}</dd>
						</div>
						<div>
							<dt>Status</dt>
							<dd>{activeClass.published ? 'Published' : 'Draft'}</dd>
						</div>
					</dl>
					<button type="button" class="primary" onclick={openSettings}>Edit settings</button>
				</div>
			{:else}
				<div class="title title-row">
					<div>
						<span>Class setup</span>
						<h2>Build your learning space.</h2>
						<p>Add modules, learning content, activities, and quizzes.</p>
					</div>
					<button type="button" class="secondary" onclick={openClass}>+ Create class</button>
				</div>
				<div class="code">
					<div>
						<span>Student class code</span><strong>{activeClass.code}</strong><small
							>18 students have joined</small
						>
					</div>
					<button type="button" onclick={copyCode}>{copied ? 'Copied!' : 'Copy code'}</button>
				</div>
				<div class="workspace">
					<section>
						<div class="section-head">
							<div>
								<span>Course structure</span>
								<h3>Modules</h3>
							</div>
							<button type="button" onclick={() => openModule()}>+ Add module</button>
						</div>
						{#if !activeClass.modules.length}<div class="card">
								<h3>No modules yet</h3>
								<p>Group related content into a module.</p>
								<button type="button" class="primary" onclick={() => openModule()}
									>Create module</button
								>
							</div>{/if}
						<div class="modules">
							{#each activeClass.modules as module, index (module.id)}<div
									class:selected={selectedId === module.id}
									class="module"
								>
									<div class="reorder">
										<button
											type="button"
											disabled={index === 0}
											aria-label={`Move ${module.title} up`}
											onclick={() => move(index, -1)}>↑</button
										><button
											type="button"
											disabled={index === activeClass.modules.length - 1}
											aria-label={`Move ${module.title} down`}
											onclick={() => move(index, 1)}>↓</button
										>
									</div>
									<button type="button" class="module-main" onclick={() => (selectedId = module.id)}
										><b>{String(index + 1).padStart(2, '0')}</b><span
											><strong>{module.title}</strong><small
												>{module.description || 'No description'}</small
											><em>{module.items.length} items</em></span
										></button
									>
								</div>{/each}
						</div>
					</section>
					{#if selectedModule}<aside class="detail">
							<div class="detail-head">
								<div>
									<span>Selected module</span>
									<h3>{selectedModule.title}</h3>
								</div>
								<div>
									<button type="button" onclick={() => openModule(selectedModule)}>Edit</button
									><button type="button" class="danger" onclick={removeModule}>Delete</button>
								</div>
							</div>
							<div class="items">
								{#each selectedModule.items as item, index (item.id)}<button
										type="button"
										onclick={() => openItem(item)}
										><i class:quiz={item.type === 'Quiz'}
											>{item.type === 'Quiz' ? '?' : index + 1}</i
										><span
											><strong>{item.title}</strong><small>{item.type} · {item.details}</small
											></span
										><em>Edit ›</em></button
									>{/each}
							</div>
							<button type="button" class="add" onclick={() => openItem()}
								><b>+</b><span
									><strong>Add class content</strong><small>Article, video, activity, or quiz</small
									></span
								></button
							>
							<button type="button" class="quiz-card" onclick={() => openItem(undefined, true)}
								><b>?</b><span
									><strong>Create a quiz</strong><small>Add a knowledge check to this module.</small
									></span
								><em>Configure →</em></button
							>
						</aside>{/if}
				</div>
			{/if}
		</section>
	</main>
</div>

{#if modal && modal !== 'preview'}<div
		class="backdrop"
		role="presentation"
		onclick={(e) => e.currentTarget === e.target && (modal = null)}
	>
		<div
			class:cms={modal === 'content'}
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<button type="button" class="close" aria-label="Close" onclick={() => (modal = null)}
				>×</button
			>
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
							<button type="button" class="secondary" onclick={() => (modal = null)}>Cancel</button
							><button class="primary" type="submit">Save content</button>
						</div>
					</div>
					<div class="cms-layout">
						<section class="cms-editor">
							<div class="cms-tabs" role="tablist" aria-label="Content editor view">
								<button
									type="button"
									role="tab"
									aria-selected={cmsView === 'write'}
									class:active={cmsView === 'write'}
									onclick={() => (cmsView = 'write')}>Write</button
								>
								<button
									type="button"
									role="tab"
									aria-selected={cmsView === 'preview'}
									class:active={cmsView === 'preview'}
									onclick={() => (cmsView = 'preview')}>Preview</button
								>
							</div>
							{#if cmsView === 'write'}
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
									<button type="button" title="Link" onclick={() => insertBlock('[', '](https://)')}
										>Link</button
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
							{:else}
								<article class="content-preview">
									<span>{itemType}</span>
									<h1>{name || 'Untitled content'}</h1>
									{#if summary}<p class="lead">{summary}</p>{/if}
									<div class="preview-body">
										{@html renderMarkdown(body || 'Start writing to preview your lesson content.')}
									</div>
								</article>
							{/if}
						</section>
						<aside class="cms-sidebar">
							<h3>Content settings</h3>
							<label
								>Content type<select bind:value={itemType}
									><option>Article</option><option>Video</option><option>Activity</option><option
										>Quiz</option
									></select
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
		<div class="modal preview" role="dialog" aria-modal="true" aria-labelledby="preview-title">
			<button type="button" class="close" aria-label="Close" onclick={() => (modal = null)}
				>×</button
			><span>Student preview</span>
			<h2 id="preview-title">{activeClass.name}</h2>
			<p>{activeClass.description}</p>
			{#each activeClass.modules as module, index}<article>
					<strong>{index + 1}. {module.title}</strong><small
						>{module.items.length} learning items</small
					>
				</article>{/each}
		</div>
	</div>{/if}

<style>
	:global(body) {
		background: #f5f2e9;
		color: #18271e;
	}
	:global(button:focus-visible),
	:global(a:focus-visible),
	:global(input:focus-visible),
	:global(select:focus-visible),
	:global(textarea:focus-visible) {
		outline: 3px solid #e55b34;
		outline-offset: 2px;
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.3;
	}
	.shell {
		display: grid;
		min-height: 100dvh;
		grid-template-columns: 15.5rem 1fr;
	}
	.shell > aside {
		position: fixed;
		inset: 0 auto 0 0;
		z-index: 30;
		display: flex;
		width: 15.5rem;
		height: 100dvh;
		flex-direction: column;
		padding: 1.8rem 1.25rem 1.2rem;
		border-right: 1px solid #d9d8cc;
		background: #efede4;
	}
	.label {
		margin: 3rem 0.5rem 0.8rem;
		color: #8a9089;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	nav {
		display: grid;
		gap: 0.3rem;
	}
	nav button {
		min-height: 3rem;
		padding: 0 0.9rem;
		border: 0;
		border-radius: 0.65rem;
		background: transparent;
		color: #657068;
		font-weight: 650;
		text-align: left;
	}
	nav button.active {
		background: #183f2a;
		color: white;
	}
	.switcher {
		margin-top: auto;
		padding: 1rem 0;
		border-top: 1px solid #d4d3ca;
	}
	.switcher label {
		display: block;
		margin-bottom: 0.4rem;
		color: #777;
		font-size: 0.65rem;
	}
	.switcher select {
		width: 100%;
		min-height: 2.6rem;
		border: 1px solid #cbc9bf;
		border-radius: 0.5rem;
		background: white;
		font-size: 0.72rem;
	}
	.switcher button {
		width: 100%;
		min-height: 2.5rem;
		margin-top: 0.5rem;
		border: 1px dashed #aeb6ad;
		border-radius: 0.5rem;
		background: transparent;
		color: #294733;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.profile {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding-top: 1rem;
		border-top: 1px solid #d4d3ca;
	}
	.profile > span {
		display: grid;
		width: 2.3rem;
		height: 2.3rem;
		place-items: center;
		border-radius: 50%;
		background: #dce7d8;
	}
	.profile strong,
	.profile small {
		display: block;
		font-size: 0.75rem;
	}
	.profile small {
		color: #888;
		font-size: 0.65rem;
	}
	main {
		grid-column: 2;
		min-width: 0;
	}
	header {
		display: flex;
		min-height: 6rem;
		align-items: center;
		gap: 1rem;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
		border-bottom: 1px solid #d9d8cc;
		background: #f8f6ef;
	}
	header p {
		margin: 0 0 0.3rem;
		color: #858c84;
		font-size: 0.63rem;
		font-weight: 750;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	header h1 {
		margin: 0;
		font:
			500 1.35rem Georgia,
			serif;
	}
	.actions {
		display: flex;
		gap: 0.7rem;
		margin-left: auto;
	}
	.primary,
	.secondary {
		min-height: 2.65rem;
		padding: 0 1rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 750;
	}
	.primary {
		border: 1px solid #183f2a;
		background: #183f2a;
		color: white;
	}
	.secondary {
		border: 1px solid #c5c5bb;
		background: white;
		color: #304238;
	}
	.menu {
		display: none;
		min-width: 2.7rem;
		min-height: 2.7rem;
		border: 1px solid #ccc;
		border-radius: 50%;
		background: white;
	}
	.content {
		max-width: 92rem;
		margin: auto;
		padding: 3rem clamp(1.5rem, 4vw, 4.5rem) 5rem;
	}
	.title > span,
	.title > div > span,
	.section-head span,
	.detail-head span,
	.modal > span {
		color: #e15a34;
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.title h2 {
		margin: 0.6rem 0;
		color: #183f2a;
		font:
			400 clamp(2.5rem, 4vw, 4rem)/1 Georgia,
			serif;
		letter-spacing: -0.05em;
	}
	.title p {
		margin: 0;
		color: #6d756f;
	}
	.title-row {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
	}
	.code {
		display: flex;
		align-items: center;
		margin: 2.5rem 0;
		padding: 1.1rem 1.3rem;
		border: 1px solid #cbd8c8;
		border-radius: 0.8rem;
		background: #e9f0e4;
	}
	.code span,
	.code strong,
	.code small {
		display: block;
	}
	.code span {
		font-size: 0.62rem;
		font-weight: 750;
		text-transform: uppercase;
	}
	.code strong {
		margin: 0.2rem 0;
		font: 700 1.35rem ui-monospace;
		letter-spacing: 0.12em;
	}
	.code small {
		color: #748078;
		font-size: 0.62rem;
	}
	.code button {
		margin-left: auto;
		min-height: 2.5rem;
		padding: 0 1rem;
		border: 1px solid #b9c8b7;
		border-radius: 999px;
		background: white;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.workspace {
		display: grid;
		grid-template-columns: minmax(22rem, 0.9fr) minmax(28rem, 1.1fr);
		gap: 1.5rem;
	}
	.section-head,
	.detail-head {
		display: flex;
		min-height: 4rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.section-head h3,
	.detail-head h3 {
		margin: 0.25rem 0 0;
		font:
			500 1.2rem Georgia,
			serif;
	}
	.section-head button,
	.detail-head button {
		min-height: 2.35rem;
		padding: 0 0.8rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		background: white;
		font-size: 0.68rem;
		font-weight: 700;
	}
	.modules {
		display: grid;
		gap: 0.65rem;
	}
	.module {
		display: flex;
		min-height: 6.5rem;
		overflow: hidden;
		border: 1px solid #dbdad1;
		border-radius: 0.75rem;
		background: #fbfaf5;
	}
	.module.selected {
		border-color: #52725c;
		box-shadow: inset 3px 0 #183f2a;
	}
	.reorder {
		display: flex;
		width: 2.3rem;
		flex-direction: column;
		justify-content: center;
		border-right: 1px solid #e4e3dc;
	}
	.reorder button {
		height: 2rem;
		border: 0;
		background: transparent;
	}
	.module-main {
		display: grid;
		width: 100%;
		grid-template-columns: 2.7rem 1fr;
		align-items: center;
		gap: 0.7rem;
		padding: 1rem;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
	}
	.module-main > b {
		color: #e15a34;
		font:
			500 1.2rem Georgia,
			serif;
	}
	.module-main strong,
	.module-main small,
	.module-main em {
		display: block;
	}
	.module-main strong {
		font:
			500 0.95rem Georgia,
			serif;
	}
	.module-main small {
		margin: 0.3rem 0;
		color: #737d75;
		font-size: 0.65rem;
	}
	.module-main em {
		color: #999;
		font-size: 0.6rem;
		font-style: normal;
	}
	.detail {
		overflow: hidden;
		border: 1px solid #d8d7ce;
		border-radius: 0.85rem;
		background: #fbfaf5;
	}
	.detail-head {
		padding: 0.8rem 1.2rem;
		border-bottom: 1px solid #dfded6;
	}
	.detail-head > div:last-child {
		display: flex;
		gap: 0.4rem;
	}
	.detail-head .danger {
		color: #9c382b;
	}
	.items {
		padding: 0 1.2rem;
	}
	.items button {
		display: grid;
		width: 100%;
		min-height: 4.6rem;
		grid-template-columns: 2rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
		border: 0;
		border-bottom: 1px solid #e3e2da;
		background: transparent;
		color: inherit;
		text-align: left;
	}
	.items i {
		display: grid;
		width: 1.8rem;
		height: 1.8rem;
		place-items: center;
		border-radius: 0.4rem;
		background: #e6ede2;
		font-size: 0.7rem;
		font-style: normal;
	}
	.items i.quiz {
		border-radius: 50%;
		background: #fbe2d7;
		color: #c64f2b;
	}
	.items strong,
	.items small {
		display: block;
	}
	.items strong {
		font:
			500 0.82rem Georgia,
			serif;
	}
	.items small,
	.items em {
		margin-top: 0.2rem;
		color: #8b918c;
		font-size: 0.61rem;
		font-style: normal;
	}
	.add,
	.quiz-card {
		display: grid;
		width: calc(100% - 2.4rem);
		grid-template-columns: 2rem 1fr;
		margin: 1rem 1.2rem;
		padding: 0.8rem;
		border: 1px dashed #b8c2b7;
		border-radius: 0.65rem;
		background: #f7f6f0;
		color: inherit;
		text-align: left;
	}
	.add > b {
		grid-row: 1/3;
		font-size: 1.4rem;
	}
	.add strong,
	.add small,
	.quiz-card strong,
	.quiz-card small {
		display: block;
	}
	.add small,
	.quiz-card small {
		color: #888;
		font-size: 0.62rem;
	}
	.quiz-card {
		grid-template-columns: 2rem 1fr auto;
		align-items: center;
		border-style: solid;
		background: #f1eee5;
	}
	.quiz-card > b {
		display: grid;
		width: 1.8rem;
		height: 1.8rem;
		place-items: center;
		border-radius: 50%;
		background: #f9dfd4;
		color: #bd4e2d;
	}
	.quiz-card em {
		font-size: 0.62rem;
		font-style: normal;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin: 2.5rem 0;
	}
	.stats article,
	.card {
		padding: 1.5rem;
		border: 1px solid #d9d8ce;
		border-radius: 0.8rem;
		background: #fbfaf5;
	}
	.stats strong,
	.stats span {
		display: block;
	}
	.stats strong {
		font:
			500 2.4rem Georgia,
			serif;
	}
	.stats span {
		color: #777;
		font-size: 0.7rem;
	}
	.card {
		margin-top: 2rem;
	}
	.card h3 {
		margin: 0.3rem 0;
		font:
			500 1.3rem Georgia,
			serif;
	}
	.card p {
		color: #777;
	}
	.card.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.card.row small {
		color: #e15a34;
		text-transform: uppercase;
	}
	.settings dl {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}
	.settings dl div {
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e1da;
	}
	.settings dt {
		color: #888;
		font-size: 0.65rem;
	}
	.settings dd {
		margin: 0.3rem 0 0;
		font:
			500 1rem Georgia,
			serif;
	}
	.settings > .primary {
		margin-top: 1rem;
	}
	.toast {
		position: fixed;
		z-index: 90;
		top: 1rem;
		left: 50%;
		padding: 0.75rem 1rem;
		border-radius: 999px;
		background: #183f2a;
		color: white;
		font-size: 0.72rem;
		transform: translateX(-50%);
	}
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		overflow: auto;
		place-items: center;
		padding: 1rem;
		background: #17241bc2;
		backdrop-filter: blur(4px);
	}
	.modal {
		position: relative;
		width: min(31rem, 100%);
		padding: 2rem;
		border-radius: 1rem;
		background: #f8f6ef;
		box-shadow: 0 30px 80px #0004;
	}
	.modal.cms {
		width: min(76rem, 100%);
		min-height: min(48rem, calc(100dvh - 2rem));
		padding: 0;
		overflow: hidden;
	}
	.cms .close {
		display: none;
	}
	.cms-form {
		display: block !important;
	}
	.cms-header {
		display: flex;
		min-height: 6.5rem;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.25rem 1.75rem;
		border-bottom: 1px solid #d9d8ce;
	}
	.cms-header span,
	.content-preview > span {
		color: #e15a34;
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.cms-header h2 {
		margin: 0.35rem 0 0;
		font-size: 1.65rem;
	}
	.cms-actions {
		display: flex;
		gap: 0.65rem;
	}
	.cms-layout {
		display: grid;
		min-height: 38rem;
		grid-template-columns: minmax(0, 1fr) 18rem;
	}
	.cms-editor {
		padding: 1.5rem 1.75rem 2rem;
	}
	.cms-sidebar {
		padding: 1.5rem;
		border-left: 1px solid #d9d8ce;
		background: #f0eee6;
	}
	.cms-sidebar h3 {
		margin: 0 0 1.5rem;
		font:
			500 1.05rem Georgia,
			serif;
	}
	.cms-tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #dddcd3;
	}
	.cms-tabs button {
		min-height: 2.75rem;
		padding: 0 1rem;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #717a73;
		font-weight: 750;
	}
	.cms-tabs button.active {
		border-bottom-color: #183f2a;
		color: #183f2a;
	}
	.cms-editor > label {
		margin-bottom: 1rem;
	}
	.cms-editor > label:first-of-type input {
		min-height: 3.5rem;
		font:
			500 1.1rem Georgia,
			serif;
	}
	.modal .summary-field {
		min-height: 4.5rem;
	}
	.body-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.body-label label {
		color: #566159;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.body-label span {
		color: #899089;
		font-size: 0.65rem;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.4rem;
		padding: 0.45rem;
		border: 1px solid #c8c7bd;
		border-bottom: 0;
		border-radius: 0.5rem 0.5rem 0 0;
		background: #f2f0e9;
	}
	.toolbar button {
		min-height: 2.25rem;
		padding: 0 0.65rem;
		border: 1px solid transparent;
		border-radius: 0.35rem;
		background: transparent;
		color: #34463b;
		font-size: 0.68rem;
	}
	.toolbar button:hover {
		border-color: #cbc9bf;
		background: white;
	}
	.modal .body-field {
		min-height: 19rem;
		border-radius: 0 0 0.5rem 0.5rem;
		font:
			400 0.9rem/1.7 ui-monospace,
			monospace;
	}
	.content-preview {
		max-width: 44rem;
		min-height: 28rem;
		margin: 1rem auto;
		padding: 2.5rem;
		border: 1px solid #deddd5;
		border-radius: 0.8rem;
		background: white;
	}
	.content-preview h1 {
		margin: 0.6rem 0 1rem;
		color: #183f2a;
		font:
			500 2.4rem/1.1 Georgia,
			serif;
	}
	.content-preview .lead {
		color: #627068;
		font-size: 1.05rem;
		line-height: 1.6;
	}
	.preview-body {
		margin-top: 2rem;
		color: #34423a;
		line-height: 1.8;
		white-space: pre-wrap;
	}
	.cms-location,
	.cms-status {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #d6d4cb;
	}
	.cms-location span,
	.cms-location strong,
	.cms-location small,
	.cms-status strong,
	.cms-status small {
		display: block;
	}
	.cms-location span {
		margin-bottom: 0.55rem;
		color: #7d857f;
		font-size: 0.65rem;
		font-weight: 750;
		text-transform: uppercase;
	}
	.cms-location strong,
	.cms-status strong {
		font-size: 0.75rem;
	}
	.cms-location small,
	.cms-status small {
		margin-top: 0.25rem;
		color: #858c86;
		font-size: 0.65rem;
	}
	.cms-status {
		display: flex;
		gap: 0.7rem;
	}
	.cms-status > span {
		width: 0.6rem;
		height: 0.6rem;
		margin-top: 0.15rem;
		border-radius: 50%;
		background: #e15a34;
	}
	.modal h2 {
		margin: 0.5rem 0 1.5rem;
		font:
			500 2rem Georgia,
			serif;
	}
	.close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid #ccc;
		border-radius: 50%;
		background: transparent;
		font-size: 1.3rem;
	}
	.modal form {
		display: grid;
		gap: 1rem;
	}
	.modal label {
		display: grid;
		gap: 0.4rem;
		color: #566159;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.modal input,
	.modal select,
	.modal textarea {
		width: 100%;
		min-height: 2.8rem;
		border: 1px solid #c8c7bd;
		border-radius: 0.5rem;
		background: white;
		font:
			400 0.85rem Inter,
			sans-serif;
	}
	.modal textarea {
		min-height: 5rem;
		padding: 0.7rem;
		resize: vertical;
	}
	.preview p {
		color: #6e776f;
	}
	.preview article {
		display: flex;
		justify-content: space-between;
		padding: 1rem 0;
		border-bottom: 1px solid #ddd;
	}
	.preview article strong {
		font:
			500 0.9rem Georgia,
			serif;
	}
	.preview article small {
		color: #888;
	}
	.scrim {
		display: none;
	}
	@media (max-width: 1000px) {
		.workspace {
			grid-template-columns: 1fr;
		}
		.detail {
			margin-top: 1rem;
		}
	}
	@media (max-width: 760px) {
		.shell {
			display: block;
		}
		.shell > aside {
			transform: translateX(-105%);
			transition: transform 0.2s;
		}
		.shell > aside.open {
			transform: translateX(0);
		}
		main {
			grid-column: auto;
		}
		.menu {
			display: block;
		}
		.scrim {
			position: fixed;
			inset: 0;
			z-index: 20;
			display: block;
			border: 0;
			background: #0007;
		}
		header {
			min-height: 5rem;
			padding: 0 1rem;
		}
		.actions .secondary {
			display: none;
		}
		.content {
			padding: 2rem 1rem 4rem;
		}
		.title-row {
			display: block;
		}
		.title-row > .secondary {
			margin-top: 1.5rem;
		}
		.stats {
			grid-template-columns: 1fr;
		}
		.card.row {
			align-items: flex-start;
			flex-direction: column;
			gap: 1rem;
		}
		.settings dl {
			grid-template-columns: 1fr;
		}
		.items em {
			display: none;
		}
		.backdrop:has(.cms) {
			padding: 0;
		}
		.modal.cms {
			min-height: 100dvh;
			border-radius: 0;
		}
		.cms-header {
			align-items: flex-start;
			padding: 1rem;
		}
		.cms-header h2 {
			font-size: 1.25rem;
		}
		.cms-actions .secondary {
			display: none;
		}
		.cms-layout {
			display: flex;
			flex-direction: column;
		}
		.cms-editor,
		.cms-sidebar {
			padding: 1rem;
		}
		.cms-sidebar {
			border-top: 1px solid #d9d8ce;
			border-left: 0;
		}
		.content-preview {
			padding: 1.25rem;
		}
	}
</style>
