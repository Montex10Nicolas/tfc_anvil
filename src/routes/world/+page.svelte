<script lang="ts">
	import { getWorlds } from '../data.remote';

	const worlds = getWorlds();
</script>

<main class="flex h-screen w-screen items-center justify-center bg-black/80">
	{#if worlds.loading}
		<p>Worlds are loading...</p>
	{:else if worlds.error}
		<p>Error...</p>
	{:else if worlds.current}
		<div class="grid grid-cols-{worlds.current.length > 3 ? 3 : worlds.current.length}">
			{#each worlds.current as { name, id } (id)}
				<a href={`/world/${id}`}>
					<div class="rounded-2xl bg-white p-6">
						<p class="h-full w-full text-center align-bottom text-2xl">{name}</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p>How did I end up here</p>
	{/if}
</main>
