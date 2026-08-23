<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Northstar AI — Learn AI by doing</title>
	<meta name="description" content="A focused AI classroom for curious minds." />
</svelte:head>

<div class="site-shell">
	<header>
		<a class="brand" href={resolve('/')} aria-label="Northstar AI home"
			><span class="mark" aria-hidden="true">N</span><span>Northstar <strong>AI</strong></span></a
		>
		<a class="login-link" href={resolve('/login')}>Log in <span aria-hidden="true">→</span></a>
	</header>
	<main>
		<section class="hero">
			<div class="eyebrow"><span></span> AI, explained simply</div>
			<h1>Learn the ideas<br />shaping <em>tomorrow.</em></h1>
			<p>Short, practical classes that help you understand AI—and use it with confidence.</p>
			<a class="primary" href={resolve('/login')}
				>Enter your classroom <span aria-hidden="true">↗</span></a
			>
		</section>
		<div class="visual" aria-hidden="true">
			<div class="orb orb-one"></div>
			<div class="orb orb-two"></div>
			<div class="spark spark-one">✦</div>
			<div class="spark spark-two">✦</div>
			<div class="grid-card">
				<div class="grid-label">LEARN · BUILD · QUESTION</div>
				<div class="grid-lines"></div>
				<div class="pulse"></div>
			</div>
		</div>
	</main>
	<footer>
		<span>Small lessons. Big ideas.</span><span>© {new Date().getFullYear()} Northstar AI</span>
	</footer>
</div>
