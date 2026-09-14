<script lang="ts">
	import type { AdminClassroom } from '$lib/types/admin';
	let {
		classroom,
		userName,
		onOpenNavigation,
		onPreview,
		onTogglePublished
	}: {
		classroom: AdminClassroom;
		userName: string;
		onOpenNavigation: () => void;
		onPreview: () => void;
		onTogglePublished: () => void;
	} = $props();
</script>

<header>
	<button type="button" class="menu" aria-label="Open navigation" onclick={onOpenNavigation}
		>☰</button
	>
	<div>
		<p>{classroom.term || 'No term'} · Active class</p>
		<h1>{classroom.name}</h1>
	</div>
	<div class="actions">
		<button disabled={!classroom.id} type="button" class="secondary" onclick={onPreview}
			>Preview as student</button
		><button type="button" class="primary" disabled={!classroom.id} onclick={onTogglePublished}
			>{classroom.published ? 'Published ✓' : 'Publish class'}</button
		>
		<details class="account-menu">
			<summary aria-label={`Open profile menu for ${userName}`}>
				<span aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
			</summary>
			<div class="account-submenu">
				<div class="account-copy"><strong>{userName}</strong><small>Instructor</small></div>
				<form method="post" action="?/signOut">
					<button type="submit" class="logout-button">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M10 17l5-5-5-5M4 12h11M15 4h4v16h-4" />
						</svg>
						Log out
					</button>
				</form>
			</div>
		</details>
	</div>
</header>
