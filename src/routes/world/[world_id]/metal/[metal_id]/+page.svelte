<script lang="ts">
	import type { itemDB, ItemDBSelect } from '$lib/server/db/schema.js';
	import { onClickOutside } from 'runed';
	import { removeItem } from '../../../../data.remote';

	const { data } = $props();
	const {
		world: { name: worldName, world_id },
		metal: { name: metalName, metal_id },
		items
	} = data;
	const hideArray: boolean[] = $state(new Array(items.length).fill(false));
	let modal = $state<HTMLElement>()!;

	let editing: {
		item?: ItemDBSelect;
		editing: boolean;
	} = $state({
		editing: false
	});

	let filter = $state('');

	onClickOutside(
		() => modal,
		() => {
			editing.editing = false;
		}
	);
</script>

<svelte:window onkeydown={(e) => console.log(e)} />

{#if editing.editing}
	{@const item = editing.item}
	{#if item}
		<div
			class="absolute top-0 left-0 z-40 flex h-screen w-screen items-center justify-center bg-gray-950/80 text-black"
		>
			<div bind:this={modal} class="rounded-2xl bg-white">
				<pre class=""><code>if{JSON.stringify(item, null, 2)}</code></pre>
			</div>
		</div>
	{:else}
		<pre class="absolute top-0 left-0 rounded-2xl bg-white"><code
				>else{JSON.stringify(item, null, 2)}</code
			></pre>
	{/if}
{/if}

<main
	class="min-h-screen min-w-screen bg-black/80 {editing.editing
		? 'max-h-screen overflow-hidden'
		: ''}"
>
	<h1 class="py-2 text-center text-6xl font-black text-white">{worldName}</h1>
	<div class="mx-4 mt-4 grid grid-cols-3 gap-8 pb-8">
		{#each items as { metal_id, world_id, name, path, startingMaterial, id: itemID }, index}
			{#if !hideArray[index]}
				<div class="relative flex rounded-2xl bg-white p-6">
					<p class="font-bold capitalize">{name} {metalName}</p>
					<div class="flex w-[80%] flex-wrap gap-1">
						{#each path as value}
							<div class="absolute top-2 right-3 text-sm">
								<button
									class="cursor-pointer"
									onclick={async () => {
										hideArray[index] = true;
										await removeItem(itemID);
									}}
								>
									❌
								</button>
								<button
									onclick={() =>
										(editing = {
											item: {
												id: itemID,
												name,
												path,
												startingMaterial,
												world_id,
												metal_id
											},
											editing: true
										})}>✏️</button
								>
							</div>
							<p class="text-lg">{value}</p>
						{/each}
						<p>({path.reduce((accumulator, currentValue) => accumulator + currentValue, 0)})</p>
						<p class="absolute -bottom-1 left-4 text-2xl font-black">
							{[...path]
								.slice(
									0,
									path.findIndex((value, index) => {
										if (value !== 16) return index;
									})
								)
								.reduce((acc, cur) => acc + cur, 0)}
						</p>
					</div>
				</div>
			{/if}
		{/each}
		<a href="/?world={world_id}&metal={metal_id}">
			<div class="relative flex h-full items-center gap-2 rounded-2xl bg-sky-300 p-6">
				<span class="text-4xl">🆕</span>
				<p class="text-2xl font-bold">Create a new one</p>
			</div>
		</a>
	</div>
</main>
