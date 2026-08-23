<script lang="ts">
	let { title }: { title: string } = $props();
	const pieces = Array.from({ length: 48 }, (_, index) => ({
		id: index,
		x: (index * 37 + 11) % 100,
		delay: (index * 47) % 720,
		duration: 1900 + ((index * 83) % 800),
		drift: -90 + ((index * 41) % 180),
		turn: (index * 67) % 360,
		color: ['#e15d34', '#f2b84b', '#173e29', '#6a8e72', '#fff4d6'][index % 5],
		circle: index % 4 === 0
	}));
</script>

<div class="celebration" role="status" aria-live="polite" aria-atomic="true">
	<div class="confetti-field" aria-hidden="true">
		{#each pieces as piece (piece.id)}<i
				class:confetti-circle={piece.circle}
				class="confetti-piece"
				style={`--x: ${piece.x}%; --delay: ${piece.delay}ms; --duration: ${piece.duration}ms; --drift: ${piece.drift}px; --turn: ${piece.turn}deg; --color: ${piece.color};`}
			></i>{/each}
	</div>
	<div class="celebration-card">
		<div class="celebration-seal" aria-hidden="true">
			<svg viewBox="0 0 24 24"><path d="m7 12 3 3 7-7" /></svg>
		</div>
		<p class="celebration-kicker">Course completed</p>
		<h2>Congratulations!</h2>
		<p>You’ve completed {title}. Take a moment to celebrate your progress.</p>
	</div>
</div>
