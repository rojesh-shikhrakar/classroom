<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AdminClassroom } from '$lib/types/admin';
	import type { AdminSection } from './types';

	let {
		classes,
		userName,
		activeId = $bindable(),
		section = $bindable(),
		mobileOpen = $bindable(),
		onSwitchClass,
		onCreateClass
	}: {
		classes: AdminClassroom[];
		userName: string;
		activeId: string;
		section: AdminSection;
		mobileOpen: boolean;
		onSwitchClass: () => void;
		onCreateClass: () => void;
	} = $props();
	const links: { id: AdminSection; text: string }[] = [
		{ id: 'overview', text: 'Overview' },
		{ id: 'setup', text: 'Class setup' },
		{ id: 'students', text: 'Students' },
		{ id: 'settings', text: 'Settings' }
	];
</script>

{#if mobileOpen}<button
		type="button"
		class="scrim"
		aria-label="Close navigation"
		onclick={() => (mobileOpen = false)}
	></button>{/if}
<aside class:open={mobileOpen}>
	<a class="brand" href={resolve('/admin')}
		><span class="mark">AI</span><span>Learn <strong>AI</strong> with Rojesh</span></a
	>
	<p class="label">Instructor workspace</p>
	<nav>
		{#each links as item (item.id)}<button
				type="button"
				class:active={section === item.id}
				onclick={() => {
					section = item.id;
					mobileOpen = false;
				}}>{item.text}</button
			>{/each}
	</nav>
	<div class="switcher">
		<label for="class-select">Active class</label><select
			id="class-select"
			bind:value={activeId}
			onchange={onSwitchClass}
			>{#each classes as classroom (classroom.id)}<option value={classroom.id}
					>{classroom.name}</option
				>{/each}</select
		><button type="button" onclick={onCreateClass}>+ Create new class</button>
	</div>
	<div class="profile">
		<span>{userName.charAt(0).toUpperCase()}</span>
		<div><strong>{userName}</strong><small>Instructor</small></div>
	</div>
</aside>
