<script lang="ts">
	import type { ItemDBSelect } from '$lib/server/db/schema.js';
	import { onClickOutside } from 'runed';
	import { removeItem, updateItem } from '../../../../data.remote';

	const { data } = $props();
	const {
		world: { name: worldName, world_id },
		metal: { name: metalName, metal_id },
		items,
		inputItems
	} = data;
	const hideArray: boolean[] = $state(new Array(items.length).fill(false));
	let modal = $state<HTMLElement>()!;

	let editing: {
		item?: ItemDBSelect;
		editing: boolean;
		path: number[];
	} = $state({
		editing: false,
		path: []
	});

	let filter = $state('');
	let sortInput = $state('');

	onClickOutside(
		() => modal,
		() => {
			editing.editing = false;
		}
	);

	let sorted = $derived.by(() => {
		let arr = items;
		if (sortInput === '') {
			arr = [...items];
		} else {
			arr = [...items].filter((v) => {
				if (v.inputItemName === sortInput) {
					return v;
				}
			});
		}

		if (filter === '') return items;

		let a = arr.filter((item) => {
			if (item.name.toLowerCase().startsWith(filter.toLowerCase())) {
				return item;
			}
		});
		return a;
	});

	function onkeydown(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		const { key } = event;
		const uglyKeys = ['Control', 'Shift'];

		for (const keys of uglyKeys) {
			if (key === keys) return;
		}

		if (key === 'Escape') {
			filter = '';
			return;
		}

		if (key.toLowerCase() === 'backspace') {
			let temp = filter.split('');
			temp.splice(temp.length - 1, 1);
			filter = temp.join('');
			return;
		}
		filter += key;
	}
</script>

<svelte:window onkeydown={editing.editing ? null : onkeydown} />

{#if editing.editing}
	{@const item = editing.item}
	{#if item}
		<!-- {(editing.path = item.path)} -->
		<div
			class="absolute top-0 left-0 z-40 flex h-screen w-screen items-center justify-center bg-gray-950/80 text-black"
		>
			<div bind:this={modal} class="flex min-w-1/3 flex-col gap-4 rounded-2xl bg-white p-8">
				<h1>Editing <span class="font-black">{item.name}</span></h1>
				<input type="text" bind:value={item.name} class="rounded" />
				<select bind:value={item.inputItemName} class="rounded">
					{#each inputItems as value}
						<option>{value.name}</option>
					{/each}
				</select>
				<div class="grid grid-cols-8 gap-4">
					{#each editing.path as value, index}
						<input
							type="number"
							bind:value={
								() => value,
								(newValue) => {
									editing.path[index] = newValue;
								}
							}
							class="w-12 rounded"
						/>
					{/each}
					<button
						class="cursor-pointer rounded border p-2 font-black"
						onclick={() => editing.path.push(0)}>+</button
					>
				</div>
				<button
					onclick={() => {
						updateItem({
							name: item.name,
							inputItem: item.inputItemName,
							path: editing.path,
							id: item.id
						});
						editing.editing = false;
					}}
					class="cursor-pointer rounded bg-green-600 py-2 font-black text-white uppercase"
				>
					Update
				</button>
			</div>
		</div>
	{/if}
{/if}

<main
	class="min-h-screen min-w-screen bg-black/80 {editing.editing
		? 'max-h-screen overflow-hidden'
		: ''}"
>
	<h1 class="py-2 text-center text-6xl font-black text-white">{worldName}</h1>
	<div class="m-4 rounded bg-white px-4 py-2">
		<select bind:value={sortInput} class="cursor-pointer rounded font-semibold capitalize">
			<option value=""> none</option>
			{#each inputItems as item}
				<option value={item.name}>
					{item.name}
				</option>
			{/each}
		</select>
	</div>

	<div class="mx-4 mt-4 grid grid-cols-3 gap-8 pb-8">
		{#each sorted as { metal_id, world_id, name, path, inputItemName, id: itemID }, index}
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
									class="cursor-pointer"
									onclick={() =>
										(editing = {
											item: {
												id: itemID,
												name,
												path,
												inputItemName,
												world_id,
												metal_id
											},
											editing: true,
											path: path
										})}>✏️</button
								>
							</div>
							<p class="text-lg">{value}</p>
						{/each}
						<p>({path.reduce((accumulator, currentValue) => accumulator + currentValue, 0)})</p>
						<p class="absolute bottom-0 left-4 text-2xl font-black">
							{[...path]
								.slice(
									0,
									path.findIndex((value, index) => {
										if (value !== 16) return index;
									})
								)
								.reduce((acc, cur) => acc + cur, 0)}
						</p>
						<p class="absolute right-4 bottom-0 text-2xl font-black">
							{inputItemName}
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

<style>
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
