<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let code = $state('');
	let message = $state('');
	function joinClassroom(event: SubmitEvent) {
		event.preventDefault();
		message =
			code.trim().length >= 5
				? `Classroom ${code.trim().toUpperCase()} is ready to join.`
				: 'Enter a valid classroom code.';
	}
</script>

<svelte:head><title>Your classroom — Northstar AI</title></svelte:head>
<div class="dashboard-shell">
	<header>
		<a class="brand" href={resolve('/')}
			><span class="mark">N</span> Northstar <strong>AI</strong></a
		>
		<div class="account">
			<span class="avatar">{data.user.name.charAt(0).toUpperCase()}</span><span class="account-name"
				>{data.user.name}</span
			>
			<form method="post" action="?/signOut" use:enhance>
				<button type="submit">Sign out</button>
			</form>
		</div>
	</header>
	<main>
		<div class="welcome">
			<span>YOUR CLASSROOM</span>
			<h1>Where are we<br />learning <em>today?</em></h1>
			<p>Enter the code shared by your instructor.</p>
		</div>
		<section class="join-card">
			<div class="card-icon" aria-hidden="true">↗</div>
			<h2>Join a classroom</h2>
			<p>Class codes are usually 6–8 characters.</p>
			<form onsubmit={joinClassroom}>
				<label for="class-code">Classroom code</label><input
					id="class-code"
					bind:value={code}
					autocomplete="off"
					autocapitalize="characters"
					maxlength="12"
					placeholder="e.g. AI2026"
				/><button type="submit">Continue <span>→</span></button>
			</form>
			{#if message}<p class:error={code.trim().length < 5} class="message" aria-live="polite">
					{message}
				</p>{/if}
		</section>
	</main>
	<footer><span>Need a code?</span> Ask your instructor or course coordinator.</footer>
</div>
