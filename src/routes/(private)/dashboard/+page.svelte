<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { renderMarkdown } from '$lib/markdown';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let code = $state('');
	let joinedClassroom = $state(untrack(() => data.classroom));
	let collapsed = $state(false);
	let mobileOpen = $state(false);
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
</script>

<svelte:head>
	<title>{inClass ? currentTitle : 'Enter classroom'} - Learn AI with Rojesh</title>
	<meta name="description" content="A focused, full-screen learning space." />
</svelte:head>

{#if !inClass}
	<main class="entry-page">
		<div class="entry-mark" aria-hidden="true">AI</div>
		<section class="entry-card" aria-labelledby="entry-title">
			<p class="kicker">Rojesh classroom</p>
			<h1 id="entry-title">Your class is<br /><em>one code away.</em></h1>
			<p class="intro">Enter the class code from your instructor to open your learning space.</p>
			<form method="post" action="?/joinClassroom" novalidate>
				<label for="class-code">Class code</label>
				<div class="code-row">
					<input
						id="class-code"
						name="code"
						required
						bind:value={code}
						autocomplete="off"
						autocapitalize="characters"
						maxlength="8"
						placeholder="e.g. AI2026"
						aria-describedby={form?.error ? 'code-error' : 'code-help'}
					/>
					<button type="submit"
						><span>Enter class</span><svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="m9 18 6-6-6-6M4 12h11" /></svg
						></button
					>
				</div>
				{#if form?.error}<p class="form-note error" id="code-error" role="alert">{form.error}</p>
				{:else}<p class="form-note" id="code-help">Class codes aren’t case-sensitive.</p>{/if}
			</form>
		</section>
		<div class="entry-foot">
			<span>Signed in as {data.user.name}</span>
			<form method="post" action="?/signOut" use:enhance>
				<button type="submit">Sign out</button>
			</form>
		</div>
	</main>
{:else}
	<div class:nav-collapsed={collapsed} class="classroom-shell">
		<button
			class="mobile-menu"
			type="button"
			onclick={() => (mobileOpen = true)}
			aria-label="Open course navigation"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
		</button>
		{#if mobileOpen}<button
				class="scrim"
				onclick={() => (mobileOpen = false)}
				aria-label="Close course navigation"
			></button>{/if}

		<aside class:mobile-open={mobileOpen} aria-label="Course navigation">
			<div class="course-identity">
				<div class="course-symbol" aria-hidden="true">AI</div>
				<div class="identity-copy"><span>Course</span><strong>{activeClass?.title}</strong></div>
				<button
					class="close-mobile"
					onclick={() => (mobileOpen = false)}
					aria-label="Close navigation"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
				</button>
			</div>
			<div class="progress-block">
				<div class="progress-copy"><span>Course progress</span><strong>{progress}%</strong></div>
				<div class="progress-track" aria-label={`Course progress: ${progress} percent`}>
					<span style:width={`${progress}%`}></span>
				</div>
			</div>
			<nav>
				<p class="nav-label">Course content</p>
				{#each modules as module, index (module.id)}
					<div class="module">
						<button
							class="module-button"
							type="button"
							onclick={() => toggleModule(module.id)}
							aria-expanded={expandedModules.has(module.id)}
						>
							<span class="module-number">0{index + 1}</span>
							<span class="module-copy">
								<strong>{module.title}</strong>
								<small
									>{module.lessons.length} lessons · {module.lessons.reduce(
										(total, lesson) => total + lesson.durationMinutes,
										0
									)} min</small
								>
							</span>
							<svg
								class:rotated={expandedModules.has(module.id)}
								viewBox="0 0 24 24"
								aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg
							>
						</button>
						{#if expandedModules.has(module.id)}
							<div class="lesson-list">
								{#each module.lessons as lesson (lesson.id)}
									<button
										type="button"
										class:active={activeLesson === lesson.id}
										onclick={() => openLesson(lesson.id)}
									>
										<span class:complete={completedLessonIds.has(lesson.id)} class="lesson-dot"
										></span>
										<span><strong>{lesson.title}</strong><small>{lesson.type}</small></span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</nav>
			<div class="sidebar-bottom">
				<div class="avatar">{data.user.name.charAt(0).toUpperCase()}</div>
				<div class="student-copy"><strong>{data.user.name}</strong><span>Student</span></div>
				<form method="post" action="?/leaveClassroom" use:enhance>
					<input type="hidden" name="classroomId" value={activeClass?.id ?? ''} />
					<button type="submit" aria-label="Leave classroom">
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M10 17l5-5-5-5M4 12h11M15 4h4v16h-4" /></svg
						>
					</button>
				</form>
			</div>
		</aside>

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

		<main class="lesson-page">
			<article>
				<div class="breadcrumb">
					<span>Module {String(currentModule?.position ?? 0).padStart(2, '0')}</span>
					<i></i><span>{currentModule?.title}</span>
				</div>
				<h1>{currentTitle}</h1>
				<p class="dek">{currentLesson?.summary}</p>
				<div class="lesson-meta">
					<span
						><svg viewBox="0 0 24 24" aria-hidden="true"
							><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg
						>
						{currentLesson?.durationMinutes ?? 0} min</span
					>
					<span
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM9 4v16" /></svg>
						Lesson {currentLesson?.position ?? 0} of {currentModule?.lessons.length ?? 0}</span
					>
				</div>
				<div class="rule"></div>
				<div class="lesson-content">
					<!-- The local renderer escapes HTML and validates link protocols. -->
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderMarkdown(currentLesson?.content.join('\n\n') ?? '')}
				</div>
				{#if currentLesson?.id === 'lesson_attention'}
					<figure>
						<div
							class="concept-visual"
							aria-label="The word bank connecting most strongly to river"
						>
							<div class="word">bank</div>
							<svg viewBox="0 0 520 170" aria-hidden="true">
								<path class="strong-line" d="M80 83 C190 15 310 15 440 62" />
								<path d="M80 87 C200 90 300 92 440 87" />
								<path d="M80 91 C190 158 310 158 440 112" />
							</svg>
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
							Attention does not tell a model what a word means in isolation. It helps the model
							build meaning from context.
						</p>
					</aside>
				{/if}
				<div class="lesson-actions">
					<button
						type="button"
						class="secondary-action"
						disabled={!previousLesson}
						onclick={() => previousLesson && openLesson(previousLesson.id)}
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg> Previous</button
					>
					<form
						method="post"
						action="?/completeLesson"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success' && nextLesson) openLesson(nextLesson.id);
							};
						}}
					>
						<input type="hidden" name="lessonId" value={currentLesson?.id ?? ''} />
						<input type="hidden" name="classroomId" value={activeClass?.id ?? ''} />
						<button type="submit" class="primary-action">
							{completedLessonIds.has(currentLesson?.id ?? '')
								? nextLesson
									? 'Continue'
									: 'Course complete'
								: nextLesson
									? 'Mark complete & continue'
									: 'Mark course complete'}
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
						</button>
					</form>
				</div>
				{#if form?.completionError}<p class="completion-error" role="alert">
						{form.completionError}
					</p>{/if}
			</article>
		</main>
	</div>
{/if}

<style>
	:global(body) {
		overflow: hidden;
		background: #f8f6ef;
	}
	:global(button:focus-visible),
	:global(input:focus-visible) {
		outline: 3px solid #e46035;
		outline-offset: 3px;
	}
	svg {
		width: 1.2rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	button {
		cursor: pointer;
	}
	.entry-page {
		position: relative;
		display: grid;
		min-height: 100dvh;
		place-items: center;
		overflow: hidden;
		padding: 2rem;
		background: radial-gradient(circle at 50% 40%, #fffdf8 0 24%, transparent 55%), #f1eee5;
	}
	.entry-page::before {
		position: absolute;
		width: 36rem;
		height: 36rem;
		border: 1px solid #183f2a18;
		border-radius: 50%;
		content: '';
		box-shadow:
			0 0 0 6rem #183f2a08,
			0 0 0 12rem #183f2a05;
	}
	.entry-mark {
		position: absolute;
		top: 2rem;
		left: 2.5rem;
		display: grid;
		width: 2.6rem;
		aspect-ratio: 1;
		place-items: center;
		border-radius: 50%;
		background: #173e29;
		color: white;
		font:
			700 1.1rem Georgia,
			serif;
		transform: rotate(-6deg);
	}
	.entry-card {
		z-index: 1;
		width: min(100%, 41rem);
		text-align: center;
	}
	.kicker {
		margin: 0 0 1.5rem;
		color: #667068;
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.entry-card h1 {
		margin: 0;
		color: #173e29;
		font:
			400 clamp(3rem, 7vw, 5.9rem)/0.9 Georgia,
			serif;
		letter-spacing: -0.065em;
	}
	.entry-card h1 em {
		color: #df5a31;
		font-weight: 400;
	}
	.intro {
		max-width: 29rem;
		margin: 1.7rem auto 2.4rem;
		color: #667068;
		line-height: 1.7;
	}
	.entry-card form {
		max-width: 31rem;
		margin: auto;
		text-align: left;
	}
	.entry-card label {
		display: block;
		margin: 0 0 0.55rem 0.25rem;
		color: #35463a;
		font-size: 0.76rem;
		font-weight: 700;
	}
	.code-row {
		display: flex;
		padding: 0.4rem;
		border: 1px solid #c9cbc1;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 16px 40px #28362d12;
	}
	.code-row:focus-within {
		border-color: #173e29;
	}
	.code-row input {
		min-width: 0;
		flex: 1;
		border: 0;
		background: transparent;
		padding: 0 1.15rem;
		color: #173e29;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		outline: 0;
		text-transform: uppercase;
	}
	.code-row input::placeholder {
		color: #a0a49e;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
	}
	.code-row button {
		display: flex;
		min-height: 3.25rem;
		align-items: center;
		gap: 1.25rem;
		padding: 0 1.25rem 0 1.5rem;
		border: 0;
		border-radius: 999px;
		background: #173e29;
		color: white;
		font-size: 0.82rem;
		font-weight: 700;
		transition: 0.18s ease;
	}
	.code-row button:hover {
		background: #25583c;
		transform: translateX(2px);
	}
	.form-note {
		margin: 0.7rem 0 0 0.9rem;
		color: #7d827d;
		font-size: 0.72rem;
	}
	.form-note.error {
		color: #b13d27;
	}
	.entry-foot {
		position: absolute;
		right: 2.5rem;
		bottom: 2rem;
		left: 2.5rem;
		display: flex;
		justify-content: space-between;
		color: #737b74;
		font-size: 0.72rem;
	}
	.entry-foot form {
		display: inline;
	}
	.entry-foot button {
		border: 0;
		background: none;
		color: #173e29;
		font-weight: 700;
	}

	.classroom-shell {
		--side: 19rem;
		display: grid;
		height: 100dvh;
		grid-template-columns: var(--side) minmax(0, 1fr);
		background: #f8f6ef;
		transition: grid-template-columns 0.25s ease;
	}
	.classroom-shell.nav-collapsed {
		--side: 5.25rem;
	}
	.classroom-shell > aside {
		position: relative;
		z-index: 20;
		display: flex;
		min-width: 0;
		flex-direction: column;
		overflow: hidden;
		border-right: 1px solid #d9d8cf;
		background: #f0eee6;
	}
	.course-identity {
		display: flex;
		min-height: 6.6rem;
		align-items: center;
		gap: 0.85rem;
		padding: 0 1.25rem;
		border-bottom: 1px solid #d9d8cf;
		white-space: nowrap;
	}
	.course-symbol {
		display: grid;
		min-width: 2.55rem;
		height: 2.55rem;
		place-items: center;
		border-radius: 48% 52% 45% 55%;
		background: #173e29;
		color: white;
		font:
			700 0.82rem Georgia,
			serif;
		transform: rotate(-5deg);
	}
	.identity-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.18rem;
	}
	.identity-copy span {
		color: #7c817c;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.identity-copy strong {
		overflow: hidden;
		color: #193b29;
		font:
			700 0.95rem Georgia,
			serif;
		text-overflow: ellipsis;
	}
	.progress-block {
		padding: 1.2rem 1.35rem 1.35rem;
		border-bottom: 1px solid #d9d8cf;
	}
	.progress-copy {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.65rem;
		color: #687169;
		font-size: 0.65rem;
	}
	.progress-copy strong {
		color: #173e29;
	}
	.progress-track {
		height: 3px;
		overflow: hidden;
		border-radius: 3px;
		background: #d2d4cb;
	}
	.progress-track span {
		display: block;
		width: 18%;
		height: 100%;
		background: #e15d34;
	}
	nav {
		flex: 1;
		overflow-y: auto;
		padding: 1.3rem 0.75rem;
	}
	.nav-label {
		margin: 0 0.6rem 0.8rem;
		color: #5f675f;
		font-size: 0.75rem;
		font-weight: 750;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.module {
		border-bottom: 1px solid #dddcd4;
	}
	.module-button {
		display: grid;
		width: 100%;
		min-height: 4.25rem;
		grid-template-columns: 1.8rem 1fr auto;
		align-items: center;
		gap: 0.55rem;
		padding: 0.7rem 0.55rem;
		border: 0;
		background: transparent;
		color: #26382c;
		text-align: left;
	}
	.module-button:hover {
		background: #e8e7df;
	}
	.module-number {
		color: #a2a29c;
		font:
			italic 0.75rem Georgia,
			serif;
	}
	.module-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.28rem;
	}
	.module-copy strong {
		overflow: hidden;
		font-size: 0.78rem;
		text-overflow: ellipsis;
	}
	.module-copy small {
		color: #5f675f;
		font-size: 0.75rem;
	}
	.module-button > svg {
		width: 0.9rem;
		transition: transform 0.18s;
	}
	.module-button > svg.rotated {
		transform: rotate(90deg);
	}
	.lesson-list {
		padding: 0 0.15rem 0.75rem;
	}
	.lesson-list button {
		display: grid;
		width: 100%;
		grid-template-columns: 1.8rem 1fr;
		gap: 0.55rem;
		padding: 0.65rem 0.55rem;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: #667068;
		text-align: left;
	}
	.lesson-list button:hover,
	.lesson-list button.active {
		background: #fff;
		color: #173e29;
	}
	.lesson-list button.active {
		box-shadow: inset 3px 0 #e15d34;
	}
	.lesson-list button > span:last-child {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.lesson-list strong {
		font-size: 0.7rem;
		font-weight: 650;
		line-height: 1.3;
	}
	.lesson-list small {
		color: #5f675f;
		font-size: 0.75rem;
		text-transform: capitalize;
	}
	.lesson-dot {
		display: grid;
		width: 1rem;
		height: 1rem;
		place-items: center;
		border: 1px solid #b9bcb5;
		border-radius: 50%;
	}
	.lesson-dot.complete {
		border-color: #173e29;
		background: #173e29;
		box-shadow: inset 0 0 0 2px #fff;
	}
	.sidebar-bottom {
		display: flex;
		min-height: 4.9rem;
		align-items: center;
		gap: 0.7rem;
		padding: 0 1.1rem;
		border-top: 1px solid #d9d8cf;
		white-space: nowrap;
	}
	.avatar {
		display: grid;
		min-width: 2rem;
		height: 2rem;
		place-items: center;
		border-radius: 50%;
		background: #dbd3bd;
		color: #173e29;
		font-size: 0.7rem;
		font-weight: 750;
	}
	.student-copy {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.12rem;
		overflow: hidden;
	}
	.student-copy strong {
		overflow: hidden;
		font-size: 0.68rem;
		text-overflow: ellipsis;
	}
	.student-copy span {
		color: #5f675f;
		font-size: 0.75rem;
	}
	.sidebar-bottom button,
	.close-mobile {
		display: grid;
		min-width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 0;
		background: transparent;
		color: #777d77;
	}
	.sidebar-bottom form {
		display: grid;
	}
	.collapse-control {
		position: fixed;
		z-index: 25;
		top: 50%;
		left: calc(var(--side) - 0.85rem);
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 1px solid #d2d2ca;
		border-radius: 999px;
		background: #f8f6ef;
		color: #687168;
		transform: translateY(-50%);
		transition: left 0.25s ease;
	}
	.collapse-control svg {
		width: 0.8rem;
		transition: transform 0.2s;
	}
	.collapse-control svg.flip {
		transform: rotate(180deg);
	}
	.nav-collapsed .identity-copy,
	.nav-collapsed .progress-block,
	.nav-collapsed .nav-label,
	.nav-collapsed .module-copy,
	.nav-collapsed .module-button > svg,
	.nav-collapsed .lesson-list,
	.nav-collapsed .student-copy,
	.nav-collapsed .sidebar-bottom button {
		display: none;
	}
	.nav-collapsed .course-identity,
	.nav-collapsed .sidebar-bottom {
		justify-content: center;
		padding: 0;
	}
	.nav-collapsed .module-button {
		display: flex;
		justify-content: center;
		padding: 0;
	}
	.nav-collapsed .module-number {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border-radius: 50%;
	}
	.nav-collapsed .module-button:hover .module-number {
		background: white;
	}
	.close-mobile,
	.mobile-menu,
	.scrim {
		display: none;
	}

	.lesson-page {
		min-width: 0;
		overflow-y: auto;
		scroll-behavior: smooth;
	}
	article {
		width: min(100% - 3rem, 49rem);
		margin: 0 auto;
		padding: clamp(4rem, 9vh, 7rem) 0 6rem;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #798079;
		font-size: 0.63rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.breadcrumb i {
		width: 1.8rem;
		height: 1px;
		background: #e15d34;
	}
	article h1 {
		max-width: 44rem;
		margin: 1.25rem 0 1.3rem;
		color: #173e29;
		font:
			400 clamp(3.1rem, 6vw, 5.6rem)/0.94 Georgia,
			serif;
		letter-spacing: -0.055em;
	}
	.dek {
		max-width: 39rem;
		margin: 0;
		color: #697169;
		font:
			400 clamp(1.05rem, 2vw, 1.25rem)/1.65 Georgia,
			serif;
	}
	.lesson-meta {
		display: flex;
		gap: 1.5rem;
		margin-top: 2rem;
		color: #5f675f;
		font-size: 0.75rem;
	}
	.lesson-meta span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.lesson-meta svg {
		width: 0.95rem;
	}
	.rule {
		height: 1px;
		margin: 2.25rem 0;
		background: #dddcd4;
	}
	.lesson-content :global(p) {
		color: #39463c;
		font:
			400 1.08rem/1.85 Georgia,
			serif;
	}
	.lesson-content :global(p:first-child) {
		color: #243c2d;
		font-size: 1.3rem;
		line-height: 1.7;
	}
	.lesson-content :global(h1),
	.lesson-content :global(h2),
	.lesson-content :global(h3) {
		margin: 2.25rem 0 0.8rem;
		color: #173e29;
		font-family: Georgia, serif;
	}
	.lesson-content :global(ul),
	.lesson-content :global(ol) {
		padding-left: 1.5rem;
		color: #39463c;
		font:
			400 1.08rem/1.85 Georgia,
			serif;
	}
	.lesson-content :global(blockquote) {
		margin: 2rem 0;
		padding: 0.2rem 1.5rem;
		border-left: 3px solid #e15d34;
		background: #efede5;
	}
	.lesson-content :global(a) {
		color: #b94829;
		text-underline-offset: 0.16em;
	}
	article h2 {
		margin: 3.3rem 0 1rem;
		color: #173e29;
		font:
			400 2rem/1.15 Georgia,
			serif;
		letter-spacing: -0.03em;
	}
	figure {
		margin: 3rem 0;
	}
	.concept-visual {
		position: relative;
		display: flex;
		min-height: 12rem;
		align-items: center;
		justify-content: space-between;
		overflow: hidden;
		padding: 2rem 3.5rem;
		border: 1px solid #d4d6cd;
		background: #eeece3;
	}
	.concept-visual > svg {
		position: absolute;
		inset: 50% auto auto 50%;
		width: 72%;
		height: 90%;
		transform: translate(-50%, -50%);
	}
	.concept-visual path {
		stroke: #a7aca6;
		stroke-width: 1;
	}
	.concept-visual .strong-line {
		stroke: #df5a31;
		stroke-width: 2.5;
	}
	.word,
	.choices span {
		z-index: 2;
		padding: 0.6rem 1rem;
		border: 1px solid #c8cbc4;
		border-radius: 999px;
		background: #f8f6ef;
		color: #314238;
		font:
			italic 1rem Georgia,
			serif;
	}
	.choices {
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.choices span {
		padding: 0.42rem 0.9rem;
		font-size: 0.82rem;
	}
	.choices .chosen {
		border-color: #e15d34;
		background: #fff3ed;
		color: #b84325;
	}
	figcaption {
		margin-top: 0.75rem;
		color: #8a8e89;
		font-size: 0.67rem;
		text-align: center;
	}
	.callout {
		margin: 3rem 0;
		padding: 1.6rem 1.8rem;
		border-left: 3px solid #e15d34;
		background: #efede5;
	}
	.callout span {
		color: #b94829;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.callout p {
		margin: 0.55rem 0 0;
		color: #2d4133;
		font:
			400 1rem/1.65 Georgia,
			serif;
	}
	.lesson-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid #dddcd4;
	}
	.lesson-actions button {
		display: flex;
		min-height: 3rem;
		align-items: center;
		gap: 0.7rem;
		border-radius: 999px;
		padding: 0 1.2rem;
		font-size: 0.72rem;
		font-weight: 700;
	}
	.lesson-actions form {
		margin: 0;
	}
	.lesson-actions button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}
	.completion-error {
		margin: 0.75rem 0 0;
		color: #a33b24;
		font-size: 0.8rem;
		text-align: right;
	}
	.secondary-action {
		border: 1px solid #c8cac2;
		background: transparent;
		color: #4f5c52;
	}
	.primary-action {
		border: 1px solid #173e29;
		background: #173e29;
		color: white;
	}
	.lesson-actions button:hover {
		transform: translateY(-1px);
	}

	@media (max-width: 760px) {
		.entry-page {
			padding: 1.25rem;
		}
		.entry-mark {
			top: 1.25rem;
			left: 1.25rem;
		}
		.entry-foot {
			right: 1.25rem;
			bottom: 1.25rem;
			left: 1.25rem;
		}
		.code-row {
			display: grid;
			border-radius: 1.25rem;
		}
		.code-row input {
			min-height: 3.4rem;
			text-align: center;
		}
		.code-row button {
			justify-content: center;
		}
		.classroom-shell,
		.classroom-shell.nav-collapsed {
			display: block;
		}
		.classroom-shell > aside {
			position: fixed;
			inset: 0 auto 0 0;
			width: min(87vw, 20rem);
			transform: translateX(-102%);
			transition: transform 0.22s ease;
		}
		.classroom-shell > aside.mobile-open {
			transform: translateX(0);
		}
		.close-mobile {
			display: grid;
			margin-left: auto;
		}
		.mobile-menu {
			position: fixed;
			z-index: 10;
			top: 1rem;
			left: 1rem;
			display: grid;
			width: 2.8rem;
			height: 2.8rem;
			place-items: center;
			border: 1px solid #d6d6ce;
			border-radius: 50%;
			background: #f8f6efed;
			color: #173e29;
			backdrop-filter: blur(10px);
		}
		.scrim {
			position: fixed;
			z-index: 15;
			inset: 0;
			display: block;
			border: 0;
			background: #14291d70;
		}
		.collapse-control {
			display: none;
		}
		article {
			width: min(100% - 2.5rem, 49rem);
			padding-top: 6rem;
		}
		article h1 {
			font-size: clamp(2.8rem, 13vw, 4.5rem);
		}
		.concept-visual {
			padding: 1.5rem;
		}
		.lesson-actions {
			align-items: stretch;
			flex-direction: column-reverse;
		}
		.lesson-actions button {
			justify-content: center;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			scroll-behavior: auto !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
