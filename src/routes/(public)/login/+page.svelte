<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	let createAccount = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head><title>{createAccount ? 'Create account' : 'Log in'} — Learn AI</title></svelte:head>
<main class="auth-page">
	<a class="brand" href={resolve('/')} aria-label="Learn AI with Rojesh home"
		><span class="mark">N</span> Learn <strong>AI</strong> with Rojesh</a
	>
	<section class="auth-card">
		<div class="card-heading">
			<span class="mini-spark" aria-hidden="true">✦</span>
			<h1>{createAccount ? 'Start learning' : 'Welcome back'}</h1>
			<p>
				{createAccount
					? 'Create an account to join your classroom.'
					: 'Sign in to continue to your classroom.'}
			</p>
		</div>
		<form method="post" action="?/google" use:enhance>
			<button class="google" type="submit"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path
						fill="#4285f4"
						d="M21.35 12.2c0-.7-.06-1.2-.2-1.75H12v3.3h5.37a4.6 4.6 0 0 1-2 3v2.14h3.24c1.9-1.74 2.74-4.31 2.74-6.69Z"
					/><path
						fill="#34a853"
						d="M12 21.7c2.7 0 4.98-.9 6.64-2.42l-3.24-2.52c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10.02 10.02 0 0 0 12 21.7Z"
					/><path
						fill="#fbbc05"
						d="M6.39 13.59A6 6 0 0 1 6.07 12c0-.55.1-1.08.32-1.59v-2.6H3.04A9.98 9.98 0 0 0 2 12c0 1.5.36 2.93 1.04 4.19l3.35-2.6Z"
					/><path
						fill="#ea4335"
						d="M12 6.28c1.47 0 2.78.5 3.81 1.49l2.9-2.9A9.73 9.73 0 0 0 12 2.3a10.02 10.02 0 0 0-8.96 5.51l3.35 2.6C7.18 8.04 9.39 6.28 12 6.28Z"
					/></svg
				>Continue with Google</button
			>
		</form>
		<div class="divider"><span>or continue with email</span></div>
		<form method="post" action={createAccount ? '?/signUp' : '?/signIn'} use:enhance>
			{#if createAccount}<label for="name">Your name</label><input
					id="name"
					name="name"
					autocomplete="name"
					required
					placeholder="Alex Morgan"
				/>{/if}
			<label for="email">Email address</label><input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				placeholder="you@example.com"
			/>
			<label for="password">Password</label>
			<div class="password-wrap">
				<input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					autocomplete={createAccount ? 'new-password' : 'current-password'}
					minlength="8"
					required
					placeholder="At least 8 characters"
				/><button
					class="show"
					type="button"
					aria-label={showPassword ? 'Hide password' : 'Show password'}
					onclick={() => (showPassword = !showPassword)}>{showPassword ? 'Hide' : 'Show'}</button
				>
			</div>
			{#if form?.message}<p class="error" role="alert">{form.message}</p>{/if}
			<button class="submit" type="submit"
				>{createAccount ? 'Create account' : 'Log in'} <span>→</span></button
			>
		</form>
		<p class="switch">
			{createAccount ? 'Already have an account?' : "New to Rojesh's Class?"}
			<button type="button" onclick={() => (createAccount = !createAccount)}
				>{createAccount ? 'Log in' : 'Create account'}</button
			>
		</p>
	</section>
	<p class="legal">By continuing, you agree to our Terms and Privacy Policy.</p>
</main>
