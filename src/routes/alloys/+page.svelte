<script lang="ts">
	import type { alloyIngredient } from '$lib/server/db/schema.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { _uint32 } from 'zod/v4/core';
	import { createAlloyDB } from '../data.remote.js';

	const { data } = $props();
	let { alloys } = data;
	// in ingots (1 ingot = 100ml)

	let chosenAlloy = $state(alloys.length === 0 ? '' : alloys[0].name);
	let wanted = $state(1);

	let selected = $derived.by(() => {
		if (chosenAlloy === '') return null;
		const found = alloys.find((v) => v.name === chosenAlloy);
		if (found === undefined) return null;
		return found;
	});

	let stupid = new SvelteMap<string, number>();

	let mode = $state<'Calculate' | 'Create'>('Calculate');
	let alloyName = $state('');
	let ingredients = $state<alloyIngredient[]>([
		{
			fluidName: '',
			min: 0,
			max: 0
		},
		{
			fluidName: '',
			min: 0,
			max: 0
		}
	]);

	function createAlloy() {
		createAlloyDB({
			name: alloyName,
			ingredients: ingredients
		});
		alloyName = '';
		ingredients = [
			{
				fluidName: '',
				min: 0,
				max: 0
			},
			{
				fluidName: '',
				min: 0,
				max: 0
			}
		];
	}
</script>

<main class="min-h-screen w-full bg-black/80 p-4">
	<section class="rounded bg-white">
		<div class="flex h-12 items-center justify-around text-2xl">
			<button class="w-full cursor-pointer" onclick={() => (mode = 'Calculate')}>Calculate</button>
			<button class="w-full cursor-pointer" onclick={() => (mode = 'Create')}>Create</button>
		</div>
		<hr class="mt-4" />
		{#if mode === 'Calculate'}
			<div class="my-4 px-4 pb-4">
				<select placeholder="Choose alloy" bind:value={chosenAlloy}>
					{#each alloys as alloy}
						<option>
							{alloy.name}
						</option>
					{/each}
				</select>
				<input type="number" placeholder="Ingots wanted" bind:value={wanted} />
				{#if selected !== null}
					{#each selected.ingredients as ingredient, index}
						{@const ml = wanted * 100}
						{@const { fluidName, min, max } = ingredient}
						<div class="my-2 flex justify-around gap-4 text-2xl capitalize">
							<p>{fluidName} ({min}%-{max}%)</p>
							<p>
								{((ml / 100) * min).toFixed(0)}-{((ml / 100) * max).toFixed(0)}ml
							</p>
							<p>
								{((wanted / 100) * min).toFixed(2)}-{((wanted / 100) * max).toFixed(2)}ingots
							</p>
						</div>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-4 p-8">
				<input bind:value={alloyName} type="text" placeholder="Alloy name" />
				{#each ingredients as ingredient, index}
					<div class="flex gap-4">
						<label for="">
							Fluidname
							<input type="text" bind:value={ingredient.fluidName} />
						</label>
						<label for="">
							Min
							<input type="number" min="1" max="99" bind:value={ingredient.min} />
						</label>
						<label for="">
							Max
							<input type="number" min="1" max="99" bind:value={ingredient.max} />
						</label>
						<button
							class="cursor-pointer rounded bg-red-600 px-4 py-2 font-semibold text-white uppercase"
							onclick={() => {
								ingredients.splice(index, 1);
							}}>Remove</button
						>
					</div>
				{/each}
				<button
					class="cursor-pointer rounded bg-sky-600 p-2"
					onclick={() =>
						ingredients.push({
							fluidName: '',
							max: 0,
							min: 0
						})}>+</button
				>
				<button
					class="cursor-pointer rounded bg-green-400 py-2 font-semibold text-black uppercase"
					onclick={createAlloy}>Create</button
				>
			</div>
		{/if}
	</section>
	<div class="absolute top-0 right-8 rounded-2xl bg-white text-black">
		<pre><code>{JSON.stringify(stupid, null, 2)}</code></pre>
	</div>
</main>
