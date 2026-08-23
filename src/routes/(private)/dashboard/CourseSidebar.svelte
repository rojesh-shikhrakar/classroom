<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ModuleContent } from '$lib/types/classroom';

	let {
		title,
		classroomId,
		userName,
		modules,
		progress,
		activeLesson,
		completedLessonIds,
		expandedModules,
		mobileOpen = $bindable(),
		onToggleModule,
		onOpenLesson
	}: {
		title: string;
		classroomId: string;
		userName: string;
		modules: ModuleContent[];
		progress: number;
		activeLesson: string;
		completedLessonIds: Set<string>;
		expandedModules: Set<string>;
		mobileOpen: boolean;
		onToggleModule: (id: string) => void;
		onOpenLesson: (id: string) => void;
	} = $props();
</script>

<button
	class="mobile-menu"
	type="button"
	onclick={() => (mobileOpen = true)}
	aria-label="Open course navigation"
	><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button
>
{#if mobileOpen}<button
		class="scrim"
		onclick={() => (mobileOpen = false)}
		aria-label="Close course navigation"
	></button>{/if}
<aside class:mobile-open={mobileOpen} aria-label="Course navigation">
	<div class="course-identity">
		<div class="course-symbol" aria-hidden="true">AI</div>
		<div class="identity-copy"><span>Course</span><strong>{title}</strong></div>
		<button class="close-mobile" onclick={() => (mobileOpen = false)} aria-label="Close navigation"
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button
		>
	</div>
	<div class="progress-block">
		<div class="progress-copy"><span>Course progress</span><strong>{progress}%</strong></div>
		<div class="progress-track" aria-label={`Course progress: ${progress} percent`}>
			<span style:width={`${progress}%`}></span>
		</div>
	</div>
	<nav>
		<p class="nav-label">Course content</p>
		{#each modules as module, index (module.id)}<div class="module">
				<button
					class="module-button"
					type="button"
					onclick={() => onToggleModule(module.id)}
					aria-expanded={expandedModules.has(module.id)}
					><span class="module-number">0{index + 1}</span><span class="module-copy"
						><strong>{module.title}</strong><small
							>{module.lessons.length} lessons · {module.lessons.reduce(
								(total, lesson) => total + lesson.durationMinutes,
								0
							)} min</small
						></span
					><svg
						class:rotated={expandedModules.has(module.id)}
						viewBox="0 0 24 24"
						aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg
					></button
				>
				{#if expandedModules.has(module.id)}<div class="lesson-list">
						{#each module.lessons as lesson (lesson.id)}<button
								type="button"
								class:active={activeLesson === lesson.id}
								onclick={() => onOpenLesson(lesson.id)}
								><span class:complete={completedLessonIds.has(lesson.id)} class="lesson-dot"
								></span><span><strong>{lesson.title}</strong><small>{lesson.type}</small></span
								></button
							>{/each}
					</div>{/if}
			</div>{/each}
	</nav>
	<div class="sidebar-bottom">
		<div class="avatar">{userName.charAt(0).toUpperCase()}</div>
		<div class="student-copy"><strong>{userName}</strong><span>Student</span></div>
		<form method="post" action="?/leaveClassroom" use:enhance>
			<input type="hidden" name="classroomId" value={classroomId} /><button
				type="submit"
				aria-label="Leave classroom"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M10 17l5-5-5-5M4 12h11M15 4h4v16h-4" /></svg
				></button
			>
		</form>
	</div>
</aside>
