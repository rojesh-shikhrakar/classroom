<script lang="ts">
	import './admin.css';
	import { untrack } from 'svelte';
	import AdminHeader from './AdminHeader.svelte';
	import AdminModals from './AdminModals.svelte';
	import AdminSidebar from './AdminSidebar.svelte';
	import ClassSetupSection from './ClassSetupSection.svelte';
	import OverviewSection from './OverviewSection.svelte';
	import SettingsSection from './SettingsSection.svelte';
	import StudentsSection from './StudentsSection.svelte';
	import type { AdminModal as Modal, AdminSection } from './types';
	import type {
		AdminClassroom as Classroom,
		AdminLesson as Item,
		AdminModule as Module
	} from '$lib/types/admin';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let section = $state<AdminSection>('setup');
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
	let initialDraft = $state('');
	let cmsView = $state<'write' | 'preview'>('write');
	let bodyField = $state<HTMLTextAreaElement>();

	let classes = $state<Classroom[]>([]);
	let saveQueue = Promise.resolve();
	const emptyClass: Classroom = {
		id: '',
		name: 'No classroom yet',
		term: '',
		code: '',
		description: '',
		published: false,
		studentCount: 0,
		modules: []
	};
	const initialClasses = untrack(() => data.classes);
	classes = initialClasses;
	activeId = initialClasses[0]?.id ?? '';
	selectedId = initialClasses[0]?.modules[0]?.id ?? '';

	const activeClass = $derived(classes.find((c) => c.id === activeId) ?? classes[0] ?? emptyClass);
	const selectedModule = $derived(
		activeClass.modules.find((m) => m.id === selectedId) ?? activeClass.modules[0]
	);
	const itemCount = $derived(activeClass.modules.reduce((sum, m) => sum + m.items.length, 0));

	function persist(next: Classroom[], room: Classroom) {
		classes = next;
		const snapshot = JSON.stringify(room);
		saveQueue = saveQueue
			.catch(() => undefined)
			.then(async () => {
				const formData = new FormData();
				formData.set('classroom', snapshot);
				try {
					const response = await fetch('?/saveClassroom', { method: 'POST', body: formData });
					if (!response.ok) flash('Could not save class changes');
				} catch {
					flash('Could not save class changes');
				}
			});
	}
	function updateClass(fn: (value: Classroom) => Classroom) {
		if (!activeClass.id) return;
		const updated = fn(activeClass);
		persist(
			classes.map((c) => (c.id === activeId ? updated : c)),
			updated
		);
	}
	function flash(message: string) {
		notice = message;
		setTimeout(() => (notice = ''), 2000);
	}
	function draftSnapshot() {
		return JSON.stringify({ name, term, description, itemType, details, summary, body });
	}
	function markDraft() {
		initialDraft = draftSnapshot();
	}
	function closeModal() {
		if (
			modal !== 'preview' &&
			draftSnapshot() !== initialDraft &&
			!confirm('Discard your unsaved changes?')
		)
			return;
		modal = null;
	}
	function trapDialog(node: HTMLElement) {
		const previousFocus =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const focusableSelector =
			'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
		queueMicrotask(() => node.querySelector<HTMLElement>(focusableSelector)?.focus());
		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeModal();
				return;
			}
			if (event.key !== 'Tab') return;
			const focusable = [...node.querySelectorAll<HTMLElement>(focusableSelector)];
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable.at(-1)!;
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
		node.addEventListener('keydown', onKeydown);
		return {
			destroy() {
				node.removeEventListener('keydown', onKeydown);
				previousFocus?.focus();
			}
		};
	}
	function handleTabKey(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		cmsView = event.key === 'ArrowLeft' ? 'write' : 'preview';
		(event.currentTarget as HTMLElement).parentElement
			?.querySelector<HTMLElement>(`#${cmsView}-tab`)
			?.focus();
	}
	function switchClass() {
		selectedId = activeClass.modules[0]?.id ?? '';
	}
	function openClass() {
		editingId = null;
		name = '';
		term = '';
		description = '';
		markDraft();
		modal = 'class';
	}
	function openModule(value?: Module) {
		editingId = value?.id ?? null;
		name = value?.title ?? '';
		description = value?.description ?? '';
		markDraft();
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
		markDraft();
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
		markDraft();
		modal = 'settings';
	}

	function submitClass(event: SubmitEvent) {
		event.preventDefault();
		const id = crypto.randomUUID();
		const prefix = name
			.replace(/[^a-z0-9]/gi, '')
			.slice(0, 3)
			.toUpperCase()
			.padEnd(3, 'X');
		const random = crypto
			.getRandomValues(new Uint32Array(1))[0]
			.toString(36)
			.slice(0, 4)
			.toUpperCase();
		const code = `${prefix}${random}`.slice(0, 7);
		const created: Classroom = {
			id,
			name: name.trim(),
			term: term.trim(),
			code,
			description: description.trim(),
			published: false,
			studentCount: 0,
			modules: []
		};
		persist([...classes, created], created);
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
		try {
			if (!navigator.clipboard) throw new Error('Clipboard is unavailable');
			await navigator.clipboard.writeText(activeClass.code);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			flash('Could not copy the class code');
		}
	}
</script>

<svelte:head><title>Instructor workspace — Learn AI with Rojesh</title></svelte:head>

<div class="shell">
	<AdminSidebar
		{classes}
		userName={data.user.name}
		bind:activeId
		bind:section
		bind:mobileOpen
		onSwitchClass={switchClass}
		onCreateClass={openClass}
	/>
	<main>
		<AdminHeader
			classroom={activeClass}
			onOpenNavigation={() => (mobileOpen = true)}
			onPreview={() => (modal = 'preview')}
			onTogglePublished={() => {
				const wasPublished = activeClass.published;
				updateClass((classroom) => ({ ...classroom, published: !classroom.published }));
				flash(wasPublished ? 'Class unpublished' : 'Class published');
			}}
		/>
		{#if notice}<div class="toast" role="status">{notice}</div>{/if}
		<section class="content">
			{#if !activeClass.id}
				<div class="card empty-class">
					<h2>Create your first classroom.</h2>
					<p>Add a classroom before building modules and lessons.</p>
					<button type="button" class="primary" onclick={openClass}>Create classroom</button>
				</div>
			{:else if section === 'overview'}
				<OverviewSection
					classroom={activeClass}
					{itemCount}
					onOpenSetup={() => (section = 'setup')}
				/>
			{:else if section === 'students'}
				<StudentsSection classroom={activeClass} {copied} onCopyCode={copyCode} />
			{:else if section === 'settings'}
				<SettingsSection classroom={activeClass} onEdit={openSettings} />
			{:else}
				<ClassSetupSection
					classroom={activeClass}
					{selectedModule}
					bind:selectedId
					{copied}
					onCreateClass={openClass}
					onCopyCode={copyCode}
					onOpenModule={openModule}
					onMoveModule={move}
					onRemoveModule={removeModule}
					onOpenItem={openItem}
				/>
			{/if}
		</section>
	</main>
</div>

<AdminModals
	{modal}
	{activeClass}
	{selectedModule}
	{editingId}
	bind:name
	bind:term
	bind:description
	bind:itemType
	bind:details
	bind:summary
	bind:body
	bind:cmsView
	bind:bodyField
	{closeModal}
	{trapDialog}
	{handleTabKey}
	{insertBlock}
	{submitClass}
	{submitModule}
	{submitItem}
	{submitSettings}
/>
