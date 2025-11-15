<script lang="ts">
	import { removeItem } from '../../../../data.remote';

	const { data } = $props();
	const { worldName, metalName, items } = data;

	const hideArray: boolean[] = $state(new Array(items.length).fill(false));
</script>

<main class="min-h-screen min-w-screen bg-black/80">
	<h1 class="py-2 text-center text-6xl font-black text-white">{worldName}</h1>
	<div class="mx-4 mt-4 grid grid-cols-3 gap-8 pb-8">
		{#each items as { itemName, path, itemID }, index}
			{#if !hideArray[index]}
				<div class="relative flex rounded-2xl bg-white p-6">
					<p class="font-bold capitalize">{itemName} {metalName}</p>
					<div class="flex w-[80%] flex-wrap gap-1">
						{#each path as value}
							{@const isLastSixteen = path.findIndex((value, index) => {
								if (value !== 16) return index;
							})}
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
		<a href="/">
			<div class="relative flex h-full items-center gap-2 rounded-2xl bg-sky-300 p-6">
				<span class="text-4xl">🆕</span>
				<p class="text-2xl font-bold">Create a new one</p>
			</div>
		</a>
	</div>
</main>
