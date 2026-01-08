<script lang="ts">
  import type { alloyIngredient } from "$lib/server/db/schema.js";
  import { createAlloyDB } from "../data.remote.js";

  // FIXME: If you are already on the page everything is fine
  // but if you try to reload it will 500 Internal Error

  const { data } = $props();
  const alloysData = () => data;
  const { alloys: temp } = $derived(alloysData());
  const alloys = $derived(
    temp.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0)),
  );
  // in ingots (1 ingot = 100ml)

  type DisplayAlloy = {
    id: `${string}-${string}-${string}-${string}`;
    name: string;
    ingredients: DisplayIngredient[];
    amountDesired: number;
  };

  type DisplayIngredient = alloyIngredient & {
    amount: number | null;
  };

  function transformIngredients(ingredients: alloyIngredient[]): DisplayIngredient[] {
    let res: Array<DisplayIngredient> = [];

    for (const ingredient of ingredients) {
      res.push({
        ...ingredient,
        amount: null,
      });
    }

    return res;
  }

  function getRandomId() {
    return crypto.randomUUID();
  }

  const defaultAlloy: DisplayAlloy = {
    id: getRandomId(),
    name: alloys[0].name,
    ingredients: transformIngredients(alloys[0].ingredients),
    amountDesired: 40,
  };

  const defaultIngredient = {
    fluidName: "",
    min: 0,
    max: 0,
  };

  // How many to choose
  let alloysToDisplay = $state<Array<typeof defaultAlloy>>([defaultAlloy]);

  let mode = $state<"Calculate" | "Create">("Calculate");
  // Create
  let alloyName = $state("");
  let ingredients = $state<alloyIngredient[]>([{ ...defaultIngredient }, { ...defaultIngredient }]);

  function createAlloy() {
    createAlloyDB({
      name: alloyName,
      ingredients: ingredients,
    });
    alloyName = "";
    ingredients = [{ ...defaultIngredient }, { ...defaultIngredient }];
  }
</script>

<main class="min-h-screen w-full bg-black/80 p-4">
  <section class="rounded bg-white">
    <div class="flex h-12 items-center justify-around text-2xl">
      <button class="w-full cursor-pointer" onclick={() => (mode = "Calculate")}>Calculate</button>
      <button class="w-full cursor-pointer" onclick={() => (mode = "Create")}>Create</button>
    </div>
    <hr class="mt-4" />
    {#if mode === "Calculate"}
      {#each alloysToDisplay as selected, index (`${selected.id}-${index}`)}
        {@const wanted = selected.amountDesired}
        <div class="my-4 px-4 pb-4">
          <div class="around flex items-center justify-between">
            <div class="flex gap-8">
              <label>
                <p class="text-lg font-bold">Chose a metal</p>
                <select
                  placeholder="Choose alloy"
                  class="capitalize"
                  bind:value={
                    () => {
                      return selected.name;
                    },
                    (hello: string) => {
                      const found = alloys.find((value) => {
                        return value.name === hello;
                      });
                      if (found === undefined) return;
                      selected.name = found.name;
                      selected.ingredients = transformIngredients(found.ingredients);
                    }
                  }
                >
                  {#each alloys as alloy (`alloy-select-${alloy.name}`)}
                    <option class="capitalize">
                      {alloy.name}
                    </option>
                  {/each}
                </select>
              </label>
              <label class="flex items-center gap-2">
                <p>How many Ingots do you need</p>
                <input
                  type="number"
                  min="1"
                  placeholder="Ingots wanted"
                  bind:value={selected.amountDesired}
                  class="w-24 appearance-none rounded border-none text-right"
                />
              </label>
            </div>
            <button
              class="cursor-pointer rounded bg-red-600 px-4 py-2 font-bold text-white uppercase"
              onclick={() => {
                alloysToDisplay.splice(index, 1);
              }}>Remove</button
            >
          </div>
          {#if selected !== null}
            {#each selected.ingredients as ingredient, index (`ingredient-${ingredient.fluidName}-${index}`)}
              {@const ml = wanted * 100}
              {@const { fluidName, min, max } = ingredient}
              {@const minMl = parseInt(((ml / 100) * min).toFixed(0))}
              {@const maxMl = parseInt(((ml / 100) * max).toFixed(0))}
              <div class="my-2 flex justify-around gap-4 text-2xl capitalize">
                <p>{fluidName} ({min}%-{max}%)</p>
                <div>
                  <p>
                    {((ml / 100) * min).toFixed(0)}-{((ml / 100) * max).toFixed(0)}ml
                  </p>
                  <input
                    type="range"
                    step="100"
                    list="markers-{fluidName}-{index}"
                    min={minMl}
                    max={maxMl}
                  />
                  <datalist id="markers-{fluidName}-{index}">
                    {#each new Array((maxMl - minMl) / 100 + 1), index}
                      <option value={minMl + index * 100}></option>
                    {/each}
                  </datalist>
                </div>
                <label class="flex items-center gap-3 text-sm">
                  How many Ingot do you have
                  <input
                    type="number"
                    min="1"
                    bind:value={
                      () => {
                        if (ingredient.amount === null) return 0;
                        return ingredient.amount;
                      },
                      (value: number) => {
                        if (value < 0) return (ingredient.amount = 0);
                        const { min } = ingredient;
                        ingredient.amount = value;

                        const minValue = Math.round(value / (min / 100));

                        selected.amountDesired = minValue;

                        return value;
                      }
                    }
                  />
                </label>
                <p>
                  {((wanted / 100) * min).toFixed(2)}-{((wanted / 100) * max).toFixed(2)}ingots
                </p>
              </div>
            {/each}
          {/if}
        </div>
      {/each}
      <button
        class="my-4 ml-[5%] w-[90%] cursor-pointer rounded bg-sky-600 p-2 text-lg font-bold text-white uppercase"
        onclick={() => {
          alloysToDisplay.push({ ...defaultAlloy });
        }}>Another one</button
      >
    {:else}
      <div class="flex flex-col gap-4 p-8">
        <input bind:value={alloyName} type="text" placeholder="Alloy name" />
        {#each ingredients as ingredient, index (`create-${ingredient.fluidName}-${index}`)}
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
              fluidName: "",
              max: 0,
              min: 0,
            })}>+</button
        >
        <button
          class="cursor-pointer rounded bg-green-400 py-2 font-semibold text-black uppercase"
          onclick={createAlloy}>Create</button
        >
      </div>
    {/if}
  </section>
</main>
