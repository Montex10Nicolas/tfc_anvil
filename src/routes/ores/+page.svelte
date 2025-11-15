<script lang="ts">
	import { object } from 'zod';

	let oreMLAmount = $state({
		small: 10,
		poor: 15,
		normal: 25,
		rich: 35
	});

	let oreAmount = $state({
		small: 0,
		poor: 0,
		normal: 0,
		rich: 0
	});

	let total = $derived(
		oreMLAmount.small * oreAmount.small +
			oreMLAmount.poor * oreAmount.poor +
			oreMLAmount.normal * oreAmount.normal +
			oreMLAmount.rich * oreAmount.rich
	);
</script>

<main class="flex min-h-screen w-screen flex-col items-center justify-center gap-6 bg-black/80">
	<div class="flex justify-between rounded-2xl bg-white p-8 text-lg">
		<div>
			<p class="font-bold">OreToML:</p>
			<div class="flex flex-col justify-between capitalize">
				<label class="flex items-center justify-around"
					>small: <input type="number" min="0" bind:value={oreMLAmount.small} />ml</label
				>
				<label class="flex items-center justify-around">
					poor: <input type="number" min="0" bind:value={oreMLAmount.poor} />ml</label
				>
				<label class="flex items-center justify-around">
					normal: <input type="number" min="0" bind:value={oreMLAmount.normal} />ml</label
				>
				<label class="flex items-center justify-around">
					rich: <input type="number" min="0" bind:value={oreMLAmount.rich} />ml</label
				>
			</div>
		</div>
		<div>
			<p class="font-bold">Amounts:</p>
			<div class="flex flex-col justify-between capitalize">
				<label class="flex items-center justify-around"
					>small: <input type="number" min="0" bind:value={oreAmount.small} />qt</label
				>
				<label class="flex items-center justify-around">
					poor: <input type="number" min="0" bind:value={oreAmount.poor} />qt</label
				>
				<label class="flex items-center justify-around">
					normal: <input type="number" min="0" bind:value={oreAmount.normal} />qt</label
				>
				<label class="flex items-center justify-around">
					rich: <input type="number" min="0" bind:value={oreAmount.rich} />qt</label
				>
			</div>
		</div>
	</div>
	<div class="flex justify-between rounded-2xl bg-white p-4 text-2xl">
		<h2>
			{total}ml | {Math.floor(total / 100)}ingots | {total - Math.floor(total / 100) * 100}remaining
		</h2>
	</div>
</main>

<style>
	input[type='number'] {
		all: unset;
		appearance: none;
		-moz-appearance: textfield;
		width: 30%;
		border-style: none;
	}
</style>
