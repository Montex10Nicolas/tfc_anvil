<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getWorlds,
		createWorld,
		getMetals,
		createMetal,
		createItem,
		getMaterials
	} from './data.remote';
	import { useSearchParams } from 'runed/kit';
	import z from 'zod';

	const params = useSearchParams(
		z.object({
			world: z.string().default(''),
			metal: z.string().default('')
		})
	);

	const possibility = [-3, -6, -9, -15, 2, 7, 13, 16] as const;
	const worldQuery = getWorlds();
	const metalQuery = getMetals();
	const startingMaterials = getMaterials();

	let queue: number[] = $state([]);
	type PossibileHits = -1 | -15 | 2 | 7 | 13 | 16 | 0;
	let finishHits: {
		last: PossibileHits;
		secondLast: PossibileHits;
		thirdLast: PossibileHits;
	} = $state({
		last: 0,
		secondLast: 0,
		thirdLast: 0
	});
	let worldValue = $state(params.world);
	let metalValue = $state(params.metal);
	let itemName = $state('');
	let material = $state('e2101ff5-7557-4ffd-9643-83b88cada258');
	let endPoint = $state(0);
	let inputName: HTMLInputElement;

	let toReach = $derived.by(() => {
		let starting = [endPoint, endPoint, endPoint];
		if (endPoint <= 0) return starting;
		const { last, secondLast, thirdLast } = finishHits;
		for (const hit of [last, secondLast, thirdLast]) {
			switch (hit) {
				case 0:
					break;
				case -1:
					starting = [starting[0] + 3, starting[1] + 6, starting[2] + 9];
					break;
				default:
					starting = starting.map((value) => {
						return (value += hit * -1);
					});
			}
		}

		return starting;
	});

	let queueDisplay = $derived.by(() => {
		let temp = [...queue];
		let index = 0;
		for (const hit of [finishHits.thirdLast, finishHits.secondLast, finishHits.last]) {
			index++;
			if (hit === 0) continue;
			if (hit !== -1) {
				temp.push(hit);
				continue;
			}

			const dumbArray = [-3, -6, -9] as const;
			for (let i = 0; i < toReach.length; i++) {
				const value = toReach[i];
				if (current === value) {
					temp.push(dumbArray[i]);
					break;
				} else if (i + 1 == toReach.length) {
					temp.push(369);
				}
			}
		}
		return temp;
	});

	let current = $derived.by(() => {
		let value = 0;
		queue.map((v) => (value += v));
		return value;
	});

	function handleButtons(value: number) {
		const newValue = current + value;
		if (newValue < 0 || newValue > 146) return;
		current = newValue;
		queue.push(value);
	}

	async function itemCreation() {
		await createItem({
			name: itemName,
			metalID: metalValue,
			worldID: worldValue,
			materialID: material,
			path: queueDisplay
		});
		itemName = '';
		endPoint = 0;
		toReach = [0, 0, 0];
		finishHits = {
			last: 0,
			secondLast: 0,
			thirdLast: 0
		};
		clearQueue();
		inputName.focus();
	}

	function clearQueue() {
		queue = [];
	}

	onMount(() => {
		inputName.focus();
	});
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-800">
	<!-- Numbers -->
	<section
		class="flex max-h-24 min-h-24 max-w-[30%] min-w-[30%] flex-col justify-around rounded-2xl bg-white py-2"
	>
		<div class="relative flex justify-between gap-x-1 overflow-scroll">
			<button
				onclick={() => {
					queue = queue.slice(0, queue.length - 1);
				}}>🔙</button
			>
			<div class="flex max-w-2/3 min-w-2/3 flex-wrap items-center gap-x-2 gap-y-0 overflow-scroll">
				{#each queueDisplay as value}
					<p class="text-md font-semibold">{value}</p>
				{/each}
			</div>
			<button onclick={clearQueue}>🚮</button>
		</div>

		<!-- Progress -->
		<div class="flex items-center px-2">
			{#each new Array(145) as _, index}
				{@const status = () => {
					if (current === index) {
						if (toReach.find((i) => i === index)) {
							return 'found';
						} else {
							return 'current';
						}
					} else {
						if (toReach.find((i) => i === index)) {
							return 'target';
						} else {
							return 'any';
						}
					}
				}}
				{@const bgColor =
					status() === 'found'
						? 'bg-amber-600'
						: status() === 'current'
							? 'bg-sky-600'
							: status() === 'target'
								? 'bg-white'
								: 'bg-black'}
				<span style="" class="h-4 w-1 {bgColor}"></span>
			{/each}
		</div>
	</section>

	<!-- Item info -->
	<section class="flex flex-col gap-y-4 rounded-2xl bg-white p-6 text-black">
		<input bind:this={inputName} bind:value={itemName} class="rounded" placeholder="Item name" />
		<div class="grid grid-cols-2 gap-4">
			{#if worldQuery.error}
				<p>ooops!</p>
			{:else if worldQuery.loading}
				<p>Loading...</p>
			{:else if worldQuery.current !== undefined && worldQuery.current.length > 0}
				<label class="flex flex-col">
					World:
					<select class="cursor-pointer rounded" bind:value={worldValue} placeholder="World">
						{#each worldQuery.current as { id, name }}
							<option value={id}>{name}</option>
						{/each}
						<option value="new_one">Create new one</option>
					</select>
				</label>
				{#if worldValue === 'new_one'}
					<div
						class="absolute top-0 left-0 flex h-screen w-screen items-center justify-center bg-black/60"
					>
						<form
							{...createWorld}
							onsubmit={() => {
								worldValue = '';
							}}
							class="relative flex flex-col gap-4 rounded-2xl bg-white p-16"
						>
							<button type="button" class="absolute top-1 right-1" onclick={() => (worldValue = '')}
								>❌</button
							>
							<label class="flex flex-col">
								<input {...createWorld.fields.name.as('text')} placeholder="World Name" />
							</label>
							<div class="w-full">
								<button
									class="w-full rounded bg-green-700 py-2 text-center font-bold text-amber-50 uppercase"
									type="submit">Save</button
								>
							</div>
						</form>
					</div>
				{/if}
			{:else}
				<form {...createWorld}>
					<input {...createWorld.fields.name.as('text')} placeholder="World identifier" />
				</form>
			{/if}

			{#if metalQuery.error}
				<p>Something wrong</p>
			{:else if metalQuery.loading}
				<p>Loading metals...</p>
			{:else if metalQuery.current}
				<div>
					<form>
						<label class="flex flex-col">
							Metal
							<select class="cursor-pointer rounded" bind:value={metalValue}>
								{#each metalQuery.current as { name, id }}
									<option value={id}>{name}</option>
								{/each}
								<option value="new_one">Create new one</option>
							</select>
						</label>
					</form>
				</div>
				{#if metalValue === 'new_one'}
					<div
						class="absolute top-0 left-0 flex h-screen w-screen items-center justify-center bg-black/60"
					>
						<form
							{...createMetal}
							onsubmit={() => {
								metalValue = '';
							}}
							class="relative flex flex-col gap-4 rounded-2xl bg-white p-16"
						>
							<button type="button" class="absolute top-1 right-1" onclick={() => (metalValue = '')}
								>❌</button
							>
							<label class="flex flex-col">
								<input {...createMetal.fields.name.as('text')} placeholder="Metal" />
							</label>
							<div class="w-full">
								<button
									class="w-full rounded bg-green-700 py-2 text-center font-bold text-amber-50 uppercase"
									type="submit">Save</button
								>
							</div>
						</form>
					</div>
				{/if}
			{:else}
				<p>New one</p>
			{/if}

			{#if startingMaterials.loading}
				<p>Loading...</p>
			{:else if startingMaterials.error}
				<p>Something wrong....</p>
			{:else if startingMaterials.current}
				<label class="col-span-2 flex flex-col">
					Material:
					<select bind:value={material} class="cursor-pointer rounded">
						{#each startingMaterials.current as materials}
							<option value={materials.id}>
								{materials.name}
							</option>
						{/each}
					</select>
				</label>
			{/if}
		</div>
	</section>

	<!-- pad -->
	<section class="rounded-2xl bg-white p-8">
		<div class="flex justify-between">
			<label class="flex items-center justify-between gap-2">
				End point
				<input
					class="text cursor-pointer rounded px-2 py-1 text-center font-semibold"
					type="number"
					min="0"
					max="160"
					bind:value={
						() => current,
						(v) => {
							if (current > 160) {
								current = 160;
								return;
							}
							current = v;
						}
					}
				/>
			</label>
			<div>
				<p>To reach</p>
				<div class="flex gap-1">
					{#each toReach as end}
						<p>
							{end}
						</p>
					{/each}
				</div>
			</div>
		</div>

		<div class="flex justify-between">
			<label>
				last
				<section>
					<select class="cursor-pointer rounded" bind:value={finishHits.last}>
						{#each [0, -1, -15, 2, 7, 13, 16] as hit}
							<option value={hit}>{hit === 0 ? 'none' : hit === -1 ? 'hit' : hit}</option>
						{/each}
					</select>
				</section>
			</label>
			<label>
				second last
				<section>
					<select class="cursor-pointer rounded" bind:value={finishHits.secondLast}>
						{#each [0, -1, -15, 2, 7, 13, 16] as hit}
							<option value={hit}>{hit === 0 ? 'none' : hit === -1 ? 'hit' : hit}</option>
						{/each}
					</select>
				</section>
			</label>
			<label>
				third last
				<section>
					<select class="cursor-pointer rounded" bind:value={finishHits.thirdLast}>
						{#each [0, -1, -15, 2, 7, 13, 16] as hit}
							<option value={hit}>{hit === 0 ? 'none' : hit === -1 ? 'hit' : hit}</option>
						{/each}
					</select>
				</section>
			</label>
		</div>

		<div class="flex items-center gap-4">
			<div class="grid grid-cols-2 gap-2">
				{#each possibility.filter((v) => v < 0) as anvilValue}
					<button class="border px-1 py-1" onclick={() => handleButtons(anvilValue)}
						>{anvilValue}</button
					>
				{/each}
			</div>
			<div class="flex min-w-[150px] flex-col">
				<p class="text-center text-7xl font-bold">{current}</p>
				<p class="flex flex-col text-center text-lg font-medium">
					{queue.length}<span class="text-xs font-light uppercase">Steps</span>
				</p>
			</div>
			<div class="grid grid-cols-2 gap-2">
				{#each possibility.filter((v) => v > 0) as anvilValue}
					<button class="border px-1 py-1" onclick={() => handleButtons(anvilValue)}
						>{anvilValue}</button
					>
				{/each}
			</div>
		</div>
	</section>
	<div class="w-1/4">
		<button
			disabled={current === 0 || toReach.findIndex((v) => v === current) === -1}
			class="w-full rounded bg-green-700 py-2 text-center font-black text-amber-50 uppercase disabled:cursor-default disabled:bg-gray-950"
			onclick={itemCreation}>Create Item</button
		>
	</div>
</main>

<style>
	button {
		cursor: pointer;
		min-width: 40px;
		font-weight: 500;
		font-size: 20px;
		border-radius: 4px;
	}
</style>
