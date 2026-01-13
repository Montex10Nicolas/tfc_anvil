<script lang="ts">
  import * as crop from "$lib/jsons/crops.json";
  import { useSearchParams } from "runed/kit";
  import * as v from "valibot";

  interface Crop {
    name: string;
    temperature: {
      min: number;
      max: number;
    };
    hydration: {
      min: number;
      max: number;
    };
    nutrient: "Nitrogen" | "Phosphorus" | "Potassium";
  }
  const { crops } = crop as { crops: Crop[] };

  const ValiSortBy = v.fallback(
    v.nullable(v.picklist(["none", "name", "temperature", "hydration", "nutrient"])),
    null,
  );
  type Order = v.InferOutput<typeof ValiSortBy>;

  const ValiMinOrMax = v.fallback(v.nullable(v.picklist(["min", "max"])), null);
  type TypeMinOrMax = v.InferOutput<typeof ValiMinOrMax>;

  const ValiUpOrDown = v.fallback(v.nullable(v.picklist(["asc", "desc"])), null);
  type TypeUpOrDown = v.InferOutput<typeof ValiUpOrDown>;

  const params = useSearchParams(
    v.object({
      sortBy: ValiSortBy,
      minOrMax: ValiMinOrMax,
      upOrDown: ValiUpOrDown,
    }),
  );

  const order: [Order, TypeMinOrMax] = $derived([params.sortBy, params.minOrMax]);
  const upOrDown: TypeUpOrDown = $derived(params.upOrDown);

  let filter = $state("");

  let sortedCrops = $derived.by(() => {
    let arr =
      filter == ""
        ? [...crops]
        : crops.filter((crop) => {
            if (crop.name.toLowerCase().includes(filter.toLowerCase())) {
              return crop;
            }
          });

    if (order[0] === "none") return arr;
    const key = order[0];
    const minMax = order[1];
    const filtered = arr.sort((aCrop, bCrop) => {
      let aValue: string | number;
      let bValue: string | number;
      if (key === "name" || key === "nutrient") {
        aValue = aCrop[key];
        bValue = bCrop[key];
      } else if (minMax !== null && key && minMax) {
        aValue = aCrop[key][minMax];
        bValue = bCrop[key][minMax];
      } else {
        return 0;
      }

      if (upOrDown === "asc") {
        if (aValue > bValue) {
          return 1;
        }
        return -1;
      } else {
        if (aValue < bValue) {
          return 1;
        }
        return -1;
      }
    });

    return filtered;
  });

  function onkeydown(
    event: KeyboardEvent & {
      currentTarget: EventTarget & Window;
    },
  ) {
    const { key, ctrlKey } = event;
    const uglyKeys = ["Control", "Shift"];

    for (const keys of uglyKeys) {
      if (key === keys) return;
    }

    if (key === "Escape") {
      filter = "";
      return;
    }

    if (key.toLowerCase() === "backspace") {
      if (ctrlKey) {
        filter = "";
        return;
      }
      let temp = filter.split("");
      temp.splice(temp.length - 1, 1);
      filter = temp.join("");
      return;
    }
    filter += key;
  }

  function changeOrder(newOrder: Order, minMax: "min" | "max" | null = null) {
    if (newOrder === order[0] && upOrDown === "asc") {
      params.update({
        sortBy: "none",
        minOrMax: null,
        upOrDown: null,
      });
      return;
    }
    params.update({
      sortBy: newOrder,
      minOrMax: minMax,
    });
    params.upOrDown = upOrDown === null ? "desc" : upOrDown === "desc" ? "asc" : null;
  }
</script>

<svelte:window onkeydown={onkeydown} />

{#snippet displayArrow()}
  <span>{upOrDown == "asc" ? "⬆️" : "⬇️"}</span>
{/snippet}

<main class="w-screen bg-gray-800 text-white">
  <table class="w-full p-12">
    <thead class="m-4 bg-gray-950 text-center">
      <tr class="m-4 grid grid-cols-4 items-center justify-between text-lg font-black capitalize">
        <td class="flex items-center justify-center gap-3">
          <button
            class="cursor-pointer select-none"
            onclick={() => {
              changeOrder("name");
            }}>Name</button
          >
          {#if order[0] === "name"}
            {@render displayArrow()}
          {/if}
        </td>
        <td class="flex flex-col">
          <div>temperature</div>
          <div class="grid grid-cols-2">
            <button
              class="cursor-pointer"
              onclick={() => {
                changeOrder("temperature", "min");
              }}
              >Min
              {#if order[0] === "temperature" && order[1] === "min"}
                {@render displayArrow()}
              {/if}
            </button>
            <button
              class="cursor-pointer"
              onclick={() => {
                changeOrder("temperature", "max");
              }}
              >Max
              {#if order[0] === "temperature" && order[1] === "max"}
                {@render displayArrow()}
              {/if}
            </button>
          </div>
        </td>
        <td class="flex flex-col">
          <div>Hydration</div>
          <div class="grid grid-cols-2">
            <button
              class="cursor-pointer"
              onclick={() => {
                changeOrder("hydration", "min");
              }}
              >Min
              {#if order[0] === "hydration" && order[1] === "min"}
                {@render displayArrow()}
              {/if}
            </button>
            <button
              class="cursor-pointer"
              onclick={() => {
                changeOrder("hydration", "max");
              }}
              >Max

              {#if order[0] === "hydration" && order[1] === "max"}
                {@render displayArrow()}
              {/if}
            </button>
          </div>
        </td>
        <td
          class="cursor-pointer select-none"
          onclick={() => {
            changeOrder("nutrient", null);
          }}
          >Nutrient
          {#if order[0] === "nutrient"}
            {@render displayArrow()}
          {/if}
        </td>
      </tr>
    </thead>
    <tbody class="m-4">
      {#each sortedCrops as { name, hydration, nutrient, temperature } (name)}
        <tr
          class="m-4 grid grid-cols-4 items-center justify-between text-center font-semibold capitalize"
        >
          <td>{name}</td>
          <td class="flex flex-col">
            <div class="grid grid-cols-2">
              <span class="text-center">{temperature.min}</span>
              <span class="text-center">{temperature.max}</span>
            </div>
          </td>
          <td class="flex flex-col">
            <div class="grid grid-cols-2">
              <span>{hydration.min}</span>
              <span>{hydration.max}</span>
            </div>
          </td>
          <td class="text-center">{nutrient}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  td {
    border: thick 3px solid re d;
  }
</style>
