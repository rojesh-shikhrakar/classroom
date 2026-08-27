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
				<button type="button" class="primary" onclick={() => onOpenModule()}>Create module</button>
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
							><strong>{module.title}</strong><small>{module.description || 'No description'}</small
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
							><span><strong>{item.title}</strong><small>{item.type} · {item.details}</small></span
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
					><strong>Add class content</strong><small>Article, video, activity, or quiz</small></span
				></button
			>
			<button type="button" class="quiz-card" onclick={() => onOpenItem(undefined, true)}
				><b>?</b><span
					><strong>Create a quiz</strong><small>Add a knowledge check to this module.</small></span
				><em>Configure →</em></button
			>
		</aside>{/if}
</div>
