<script lang="ts">
	import { page } from '$app/state';
	import { getMetals } from '../../data.remote';

	const metals = getMetals();
	const worldID = page.params.world_id;
</script>

<main class="flex h-screen w-screen items-center justify-center bg-black/80">
	{#if metals.loading}
		<p>Loading...</p>
	{:else if metals.error}
		<p>Error...</p>
	{:else if metals.current}
		<div class="grid grid-cols-3 gap-4">
			{#each metals.current as metal}
				<a href={`/world/${worldID}/metal/${metal.id}`}>
					<div
						class="h-24 w-24 place-content-center rounded-2xl bg-white text-center text-sm font-bold"
					>
						<p class="text-lg">{metal.name}</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p>Where I'em</p>
	{/if}
</main>
