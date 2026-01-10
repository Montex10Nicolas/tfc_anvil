<script lang="ts">
  import type { AlloyDBSelect, alloyIngredient } from "$lib/server/db/schema";
  import { createAlloyDB, getAlloys } from "../data.remote";

  const alloyDB = async () => await getAlloys();

  type IngredientDisplay = alloyIngredient & {
    ingotsToUse: number;
  };

  type AlloyToDisplay = {
    name: string;
    ingredients: IngredientDisplay[];
  } & {
    amountWanted: number;
    amountRemaining: number;
  };

  const DEFAULT_WANTED = 40;

  function addInformationToAlloy(alloydb: AlloyDBSelect[]): AlloyToDisplay[] {
    const res: AlloyToDisplay[] = [];
    for (const alloy of alloydb) {
      const tempIngredient: IngredientDisplay[] = [];
      const w = DEFAULT_WANTED;
      let sum = 0;
      for (const ingredient of alloy.ingredients!) {
        const ingots = Math.ceil((w / 100) * ingredient.min);
        // console.log(alloy.name);
        // console.table(ingredient);
        // console.log(ingots);
        sum += ingots;
        tempIngredient.push({
          ...ingredient,
          ingotsToUse: ingots,
        });
      }
      res.push({
        name: alloy.name,
        ingredients: tempIngredient,
        amountWanted: w,
        amountRemaining: w - sum,
      });
    }
    return res;
  }
  let alloys = $derived(addInformationToAlloy(await alloyDB()));
  let listOfAlloy = $state([alloys[0], alloys[1]]);

  let creating = $state(false);
  let alloyCreation = $state({
    name: "",
    ingredients: [
      { fluidName: "", min: 0, max: 0 },
      { fluidName: "", min: 0, max: 0 },
    ],
  });

  function handleWanted(al: AlloyToDisplay, reset: boolean) {
    let sum = 0;
    const total = al.amountWanted;
    al.ingredients.map((value) => {
      sum += value.ingotsToUse;
      if (reset) {
        value.ingotsToUse = Math.ceil((total / 100) * value.min);
      }
    });

    al.amountRemaining = al.amountWanted - sum;
  }
</script>

<main class="relative min-h-screen w-full bg-gray-800">
  {#if !creating}
    <div class="absolute top-5 right-5 rounded-2xl bg-amber-100 p-2 text-3xl">
      <button
        class="cursor-pointer"
        onclick={() => {
          creating = true;
        }}
      >
        🆕
      </button>
    </div>
    <div class="mx-auto w-[80%] py-2">
      <button
        class="w-full cursor-pointer rounded bg-sky-400 py-1 font-bold text-white uppercase"
        onclick={() => {
          listOfAlloy.push(alloys[0]);
        }}>New One</button
      >
    </div>
    <div class="mx-auto grid w-[80%] grid-cols-2 gap-4 py-2">
      {#each listOfAlloy as al, index}
        <div class="rounded bg-white p-8">
          <div class="flex flex-col gap-1">
            <select class="rounded capitalize" bind:value={listOfAlloy[index]}>
              {#each alloys as alloy}
                <option class="capitalize" value={alloy}>{alloy.name}</option>
              {/each}
            </select>
            <label class="flex flex-col" for="alloy-{index}">
              Ingots wanted
              <input
                id="alloy-{index}"
                class="rounded"
                type="number"
                bind:value={
                  () => al.amountWanted,
                  (value) => {
                    al.amountWanted = value;
                    handleWanted(al, true);
                  }
                }
              />
            </label>
            <button
              onclick={() => {
                const sliced = listOfAlloy.filter((al, idx) => {
                  if (idx !== index) return al;
                });
                listOfAlloy = sliced;
              }}
              class="cursor-pointer rounded bg-red-700 px-2 py-2 font-bold text-white uppercase"
              >Remove</button
            >
            <p class="text-xl">{al.amountRemaining} ingots left</p>
          </div>
          <!-- Display -->
          <div>
            <div class="flex flex-col gap-8">
              {#each al.ingredients as ingredient}
                {@const wanted = al.amountWanted}
                {@const min = ingredient.min}
                {@const max = ingredient.max}
                {@const minIg = Math.ceil((wanted / 100) * min)}
                {@const maxIg = Math.floor((wanted / 100) * max)}
                <div class="flex gap-4 text-lg capitalize">
                  <div>
                    <p>{ingredient.fluidName}</p>
                    <p>{min}%-{max}%</p>
                  </div>
                  <div>
                    {#if minIg === maxIg}
                      <p>{minIg}</p>
                    {:else}
                      <p>{ingredient.ingotsToUse}</p>
                      <input
                        bind:value={
                          () => ingredient.ingotsToUse,
                          (value) => {
                            const diff = value - ingredient.ingotsToUse;
                            if (diff > al.amountRemaining) {
                              ingredient.ingotsToUse = ingredient.ingotsToUse + al.amountRemaining;
                            } else {
                              ingredient.ingotsToUse = value;
                            }

                            handleWanted(al, false);
                          }
                        }
                        list="ingot-steps-{ingredient.fluidName}"
                        type="range"
                        min={minIg}
                        max={maxIg - ingredient.ingotsToUse > al.amountRemaining
                          ? ingredient.ingotsToUse + al.amountRemaining
                          : maxIg}
                        step="1"
                      />
                      <datalist id="ingot-steps-{ingredient.fluidName}">
                        {#each new Array(maxIg - minIg), index}
                          <option value={minIg + index + 1}></option>
                        {/each}
                      </datalist>
                      <button
                        onclick={() => {
                          ingredient.ingotsToUse = 0;
                          handleWanted(al, false);
                        }}>Clear</button
                      >
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <h1 class="text-4xl text-white">No one is here :(</h1>
      {/each}
    </div>
  {:else}
    <div class="absolute top-5 right-5 rounded-2xl bg-amber-100 p-2 text-3xl">
      <button class="cursor-pointer" onclick={() => (creating = false)}> 🔙 </button>
    </div>
    <form {...createAlloyDB} class="mx-auto w-[80%] py-2">
      <div class="w-full rounded bg-white px-8 py-4">
        <label class="flex flex-col" for="">
          <input {...createAlloyDB.fields.name.as("text")} placeholder="Alloy Name" />
        </label>
        <div class="mt-4 grid grid-cols-2 gap-2">
          {#each createAlloyDB.fields.ingredients.issues() as issue}
            <p class="text-red">{issue.message}</p>
          {/each}
          {#each alloyCreation.ingredients as ingredient, index}
            <input
              placeholder="Ingredient Name"
              class="col-span-2"
              {...createAlloyDB.fields.ingredients[index].fluidName.as("text")}
            />
            <label class="flex flex-col" for="">
              min
              <input
                bind:value={ingredient.min}
                {...createAlloyDB.fields.ingredients[index].min.as("number")}
              />
            </label>
            <label class="flex flex-col" for="">
              max
              <input {...createAlloyDB.fields.ingredients[index].max.as("number")} />
            </label>
            <hr class="col-span-2 mb-2" />
          {/each}
        </div>
        <button
          class="w-full cursor-pointer rounded bg-green-600 py-2 font-bold text-black uppercase"
          >Create</button
        >
      </div>
    </form>
  {/if}
</main>
