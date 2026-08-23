<script lang="ts">
	import { enhance } from '$app/forms';
	import { renderMarkdown } from '$lib/markdown';
	import type { LessonContent, ModuleContent } from '$lib/types/classroom';

	let {
		classroomId,
		lesson,
		module,
		previousLesson,
		nextLesson,
		completedLessonIds,
		completionError,
		onOpenLesson,
		onCourseComplete
	}: {
		classroomId: string;
		lesson?: LessonContent;
		module?: ModuleContent;
		previousLesson?: LessonContent;
		nextLesson?: LessonContent;
		completedLessonIds: Set<string>;
		completionError?: string;
		onOpenLesson: (id: string) => void;
		onCourseComplete: () => void;
	} = $props();
</script>

<main class="lesson-page">
	<article>
		<div class="breadcrumb">
			<span>Module {String(module?.position ?? 0).padStart(2, '0')}</span><i></i><span
				>{module?.title}</span
			>
		</div>
		<h1>{lesson?.title ?? 'Lesson'}</h1>
		<p class="dek">{lesson?.summary}</p>
		<div class="lesson-meta">
			<span
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg
				>{lesson?.durationMinutes ?? 0} min</span
			><span
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM9 4v16" /></svg>Lesson {lesson?.position ??
					0} of {module?.lessons.length ?? 0}</span
			>
		</div>
		<div class="rule"></div>
		<div class="lesson-content">
			<!-- The local renderer escapes HTML and validates link protocols. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderMarkdown(lesson?.content.join('\n\n') ?? '')}
		</div>
		{#if lesson?.id === 'lesson_attention'}<figure>
				<div class="concept-visual" aria-label="The word bank connecting most strongly to river">
					<div class="word">bank</div>
					<svg viewBox="0 0 520 170" aria-hidden="true"
						><path class="strong-line" d="M80 83 C190 15 310 15 440 62" /><path
							d="M80 87 C200 90 300 92 440 87"
						/><path d="M80 91 C190 158 310 158 440 112" /></svg
					>
					<div class="choices">
						<span class="chosen">river</span><span>money</span><span>tilt</span>
					</div>
				</div>
				<figcaption>
					Attention scores help a model choose the meaning that best fits the context.
				</figcaption>
			</figure>
			<h2>Meaning comes from relationships</h2>
			<aside class="callout">
				<span>Key idea</span>
				<p>
					Attention does not tell a model what a word means in isolation. It helps the model build
					meaning from context.
				</p>
			</aside>{/if}
		<div class="lesson-actions">
			<button
				type="button"
				class="secondary-action"
				disabled={!previousLesson}
				onclick={() => previousLesson && onOpenLesson(previousLesson.id)}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg> Previous</button
			>
			<form
				method="post"
				action="?/completeLesson"
				use:enhance={() => {
					const completesCourse = !nextLesson;
					return async ({ result, update }) => {
						await update();
						if (result.type !== 'success') return;
						if (completesCourse) onCourseComplete();
						else if (nextLesson) onOpenLesson(nextLesson.id);
					};
				}}
			>
				<input type="hidden" name="lessonId" value={lesson?.id ?? ''} /><input
					type="hidden"
					name="classroomId"
					value={classroomId}
				/><button type="submit" class="primary-action"
					>{completedLessonIds.has(lesson?.id ?? '')
						? nextLesson
							? 'Continue'
							: 'Course complete'
						: nextLesson
							? 'Mark complete & continue'
							: 'Mark course complete'}<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="m9 18 6-6-6-6" /></svg
					></button
				>
			</form>
		</div>
		{#if completionError}<p class="completion-error" role="alert">{completionError}</p>{/if}
	</article>
</main>
