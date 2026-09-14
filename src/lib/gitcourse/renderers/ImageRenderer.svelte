<script lang="ts">
	import { mimeFor } from './detect';

	let { bytes, path }: { bytes: Uint8Array; path: string } = $props();

	let url = $state('');

	$effect(() => {
		const objUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeFor(path) }));
		url = objUrl;
		return () => URL.revokeObjectURL(objUrl);
	});
</script>

{#if url}
	<img src={url} alt={path} class="max-w-full rounded-lg" />
{/if}
