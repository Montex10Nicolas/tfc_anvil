<script lang="ts">
  import type { AlloyDBSelect, alloyIngredient } from "$lib/server/db/schema";
  import { getAlloys } from "../data.remote";

  const alloyDB = async () => await getAlloys();

  type IngredientDisplay = alloyIngredient & {
    isRestricted: boolean;
    ingotsToUse: number;
  };

  type AlloyToDisplay = {
    name: string;
    ingredients: IngredientDisplay[];
  } & {
    amountWanted: number;
    amountRemaining: number;
  };

  function addInformationToAlloy(alloydb: AlloyDBSelect[]): AlloyToDisplay[] {
    const res: AlloyToDisplay[] = [];
    for (const alloy of alloydb) {
      const a: IngredientDisplay[] = [];
      const w = 40;
      let sum = 0;
      for (const ingred of alloy.ingredients!) {
        const ingots = (w / 100) * ingred.min;
        sum += ingots;
        a.push({
          ...ingred,
          ingotsToUse: ingots,
          isRestricted: false,
        });
      }
      res.push({
        name: alloy.name,
        ingredients: a,
        amountWanted: w,
        amountRemaining: w - sum,
      });
    }
    return res;
  }

  let alloys = $state(addInformationToAlloy(await alloyDB()));
  let al = $state(alloys[5]);

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

<main>
  <select bind:value={al}>
    {#each alloys as alloy}
      <option value={alloy}>{alloy.name}</option>
    {/each}
  </select>
  <div>
    <p>{al.name}</p>
    <p>({al.amountRemaining})</p>
    <div class="flex flex-col gap-8">
      {#each al.ingredients as ingredient}
        {@const wanted = al.amountWanted}
        {@const min = ingredient.min}
        {@const max = ingredient.max}
        {@const minIg = Math.ceil((wanted / 100) * min)}
        {@const maxIg = Math.floor((wanted / 100) * max)}
        <div class="flex gap-8">
          <p>{ingredient.fluidName}</p>
          <p>{ingredient.min}</p>
          <p>{ingredient.max}</p>
          <div>
            <p>Ing: {ingredient.ingotsToUse}</p>
            {#if minIg === maxIg}
              <p>{minIg}</p>
            {:else}
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
    <input
      type="number"
      bind:value={
        () => al.amountWanted,
        (value) => {
          al.amountWanted = value;
          handleWanted(al, true);
        }
      }
    />
  </div>
</main>
