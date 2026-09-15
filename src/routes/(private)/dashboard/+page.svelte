<script lang="ts">
	import './dashboard.css';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import CompletionCelebration from './CompletionCelebration.svelte';
	import CourseSidebar from './CourseSidebar.svelte';
	import DashboardEntry from './DashboardEntry.svelte';
	import LessonView from './LessonView.svelte';
	import GitCourseView from './GitCourseView.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let code = $state('');
	let joinedClassroom = $state(untrack(() => data.classroom));
	let collapsed = $state(false);
	let mobileOpen = $state(false);
	let celebrationVisible = $state(false);
	let celebrationRun = $state(0);
	let celebrationTimer: ReturnType<typeof setTimeout> | undefined;
	const activeClass = $derived(joinedClassroom);
	const inClass = $derived(Boolean(activeClass));
	let activeLesson = $state('');
	const expandedModules = new SvelteSet<string>();

	const modules = $derived(activeClass?.modules ?? []);
	const currentLesson = $derived(
		modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === activeLesson) ??
			modules[0]?.lessons[0]
	);
	const currentModule = $derived(
		modules.find((module) => module.lessons.some((lesson) => lesson.id === currentLesson?.id))
	);
	const currentTitle = $derived(currentLesson?.title ?? 'Lesson');
	const orderedLessons = $derived(modules.flatMap((module) => module.lessons));
	const completedLessonIds = $derived(
		new SvelteSet(form?.completedLessonIds ?? data.completedLessonIds ?? [])
	);
	const progress = $derived(
		orderedLessons.length === 0
			? 0
			: Math.round((completedLessonIds.size / orderedLessons.length) * 100)
	);
	const currentLessonIndex = $derived(
		orderedLessons.findIndex((lesson) => lesson.id === currentLesson?.id)
	);
	const previousLesson = $derived(orderedLessons[currentLessonIndex - 1]);
	const nextLesson = $derived(orderedLessons[currentLessonIndex + 1]);
	$effect(() => {
		if (form?.code) code = form.code;
		if (form?.classroom) joinedClassroom = form.classroom;
		if (form?.leftClassroom) joinedClassroom = null;
		if (!activeLesson && activeClass) {
			activeLesson = activeClass.modules[0]?.lessons[0]?.id ?? '';
			expandedModules.clear();
			for (const module of activeClass.modules) expandedModules.add(module.id);
		}
	});

	function toggleModule(id: string) {
		if (expandedModules.has(id)) expandedModules.delete(id);
		else expandedModules.add(id);
	}

	function openLesson(id: string) {
		activeLesson = id;
		mobileOpen = false;
	}

	function celebrateCourseCompletion() {
		celebrationRun += 1;
		celebrationVisible = true;
		if (celebrationTimer) clearTimeout(celebrationTimer);
		celebrationTimer = setTimeout(() => (celebrationVisible = false), 4400);
	}

	onDestroy(() => {
		if (celebrationTimer) clearTimeout(celebrationTimer);
	});
</script>

<svelte:head>
	<title>{inClass ? currentTitle : 'Enter classroom'} - Learn AI with Rojesh</title>
	<meta name="description" content="A focused, full-screen learning space." />
</svelte:head>

{#if !inClass}
	<DashboardEntry bind:code userName={data.user.name} error={form?.error} />
{:else}
	{#if activeClass?.courseType === 'repository'}
		<GitCourseView
			title={activeClass.title}
			classroomId={activeClass.id}
			repoUrl={activeClass.repoUrl}
			userName={data.user.name}
		/>
	{:else}
		<div class:nav-collapsed={collapsed} class="classroom-shell">
			{#if celebrationVisible}
				{#key celebrationRun}<CompletionCelebration title={activeClass?.title ?? ''} />{/key}
			{/if}
			<CourseSidebar
				title={activeClass?.title ?? ''}
				classroomId={activeClass?.id ?? ''}
				userName={data.user.name}
				{modules}
				{progress}
				{activeLesson}
				{completedLessonIds}
				{expandedModules}
				bind:mobileOpen
				onToggleModule={toggleModule}
				onOpenLesson={openLesson}
			/>
			<button
				class="collapse-control"
				type="button"
				onclick={() => (collapsed = !collapsed)}
				aria-label={collapsed ? 'Expand course navigation' : 'Collapse course navigation'}
				aria-expanded={!collapsed}
			>
				<svg class:flip={collapsed} viewBox="0 0 24 24" aria-hidden="true"
					><path d="m14 6-6 6 6 6" /></svg
				>
			</button>
			<LessonView
				classroomId={activeClass?.id ?? ''}
				lesson={currentLesson}
				module={currentModule}
				{previousLesson}
				{nextLesson}
				{completedLessonIds}
				completionError={form?.completionError}
				onOpenLesson={openLesson}
				onCourseComplete={celebrateCourseCompletion}
			/>
		</div>
	{/if}
{/if}
