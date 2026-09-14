<script lang="ts">
	import type { AdminClassroom, AdminLesson, AdminModule } from '$lib/types/admin';
	let {
		classroom,
		selectedModule,
		selectedId = $bindable(),
		copied,
		onCreateClass,
		onCopyCode,
		onOpenModule,
		onMoveModule,
		onRemoveModule,
		onOpenItem,
		onRemoveItem
	}: {
		classroom: AdminClassroom;
		selectedModule?: AdminModule;
		selectedId: string;
		copied: boolean;
		onCreateClass: () => void;
		onCopyCode: () => void;
		onOpenModule: (module?: AdminModule) => void;
		onMoveModule: (index: number, direction: 1 | -1) => void;
		onRemoveModule: () => void;
		onOpenItem: (item?: AdminLesson, forceQuiz?: boolean) => void;
		onRemoveItem: (item: AdminLesson) => void;
	} = $props();
</script>

<div class="title title-row">
	<div>
		<span>Class setup</span>
		<h2>Build your learning space.</h2>
		<p>Add modules, learning content, activities, and quizzes.</p>
	</div>
	<button type="button" class="secondary" onclick={onCreateClass}>+ Create class</button>
</div>
<div class="code">
	<div>
		<span>Student class code</span><strong>{classroom.code}</strong><small
			>{classroom.studentCount} students have joined</small
		>
	</div>
	<button type="button" onclick={onCopyCode}>{copied ? 'Copied!' : 'Copy code'}</button>
</div>
<div class="workspace">
	{#if classroom.courseType === 'repository'}
		<section class="repo-setup-card">
			<div class="repo-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"
					><path
						d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
					/></svg
				>
			</div>
			<span>Repository course</span>
			<h3>{classroom.repoUrl.replace('https://github.com/', '')}</h3>
			<p>
				Students explore branches, commits, files, Markdown, code, images, and diffs in a
				GitHub-style course workspace.
			</p>
			<a href={classroom.repoUrl} target="_blank" rel="noreferrer"
				>Open repository <span aria-hidden="true">↗</span></a
			>
		</section>
	{:else}
		<section>
			<div class="section-head">
				<div>
					<span>Course structure</span>
					<h3>Modules</h3>
				</div>
				<button type="button" onclick={() => onOpenModule()}>+ Add module</button>
			</div>
			{#if !classroom.modules.length}<div class="card">
					<h3>No modules yet</h3>
					<p>Group related content into a module.</p>
					<button type="button" class="primary" onclick={() => onOpenModule()}>Create module</button
					>
				</div>{/if}
			<div class="modules">
				{#each classroom.modules as module, index (module.id)}<div
						class:selected={selectedId === module.id}
						class="module"
					>
						<div class="reorder">
							<button
								type="button"
								disabled={index === 0}
								aria-label={`Move ${module.title} up`}
								onclick={() => onMoveModule(index, -1)}>↑</button
							><button
								type="button"
								disabled={index === classroom.modules.length - 1}
								aria-label={`Move ${module.title} down`}
								onclick={() => onMoveModule(index, 1)}>↓</button
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
						<button type="button" onclick={() => onOpenModule(selectedModule)}>Edit</button><button
							type="button"
							class="danger"
							onclick={onRemoveModule}>Delete</button
						>
					</div>
				</div>
				<div class="items">
					{#each selectedModule.items as item, index (item.id)}<div class="item-row">
							<button type="button" class="item-main" onclick={() => onOpenItem(item)}
								><i class:quiz={item.type === 'Quiz'}>{item.type === 'Quiz' ? '?' : index + 1}</i
								><span
									><strong>{item.title}</strong><small>{item.type} · {item.details}</small></span
								><em>Edit ›</em></button
							><button
								type="button"
								class="item-delete"
								aria-label={`Delete ${item.title}`}
								onclick={() => onRemoveItem(item)}>Delete</button
							>
						</div>{/each}
				</div>
				<button type="button" class="add" onclick={() => onOpenItem()}
					><b>+</b><span
						><strong>Add class content</strong><small>Article, video, activity, or quiz</small
						></span
					></button
				>
				<button type="button" class="quiz-card" onclick={() => onOpenItem(undefined, true)}
					><b>?</b><span
						><strong>Create a quiz</strong><small>Add a knowledge check to this module.</small
						></span
					><em>Configure →</em></button
				>
			</aside>{/if}
	{/if}
</div>
