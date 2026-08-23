<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		code = $bindable(''),
		userName,
		error
	}: { code: string; userName: string; error?: string } = $props();
</script>

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
					aria-describedby={error ? 'code-error' : 'code-help'}
				/>
				<button type="submit"
					><span>Enter class</span><svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="m9 18 6-6-6-6M4 12h11" /></svg
					></button
				>
			</div>
			{#if error}<p class="form-note error" id="code-error" role="alert">{error}</p>{:else}<p
					class="form-note"
					id="code-help"
				>
					Class codes aren’t case-sensitive.
				</p>{/if}
		</form>
	</section>
	<div class="entry-foot">
		<span>Signed in as {userName}</span>
		<form method="post" action="?/signOut" use:enhance>
			<button type="submit">Sign out</button>
		</form>
	</div>
</main>
