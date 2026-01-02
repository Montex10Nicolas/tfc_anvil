<script lang="ts">
  import * as crop from "$lib/jsons/crops.json";

  type Order =
    | "none"
    | "name"
    | "temperature-min"
    | "temperature-max"
    | "hydration-min"
    | "hydration-max"
    | "nutrient";

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

  let order: Order = $state("none");
  let upOrDown: "asc" | "desc" = $state("asc");

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

    if (order === "none") return arr;
    switch (order) {
      case "temperature-min":
        arr = arr.sort((a, b) => {
          if (upOrDown === "asc") {
            return a.temperature.min - b.temperature.min;
          } else {
            return b.temperature.min - a.temperature.min;
          }
        });
        return arr;
      case "temperature-max":
        arr = arr.sort((a, b) => {
          if (upOrDown === "asc") {
            return a.temperature.max - b.temperature.max;
          } else {
            return b.temperature.max - a.temperature.max;
          }
        });
        return arr;
      case "hydration-min":
        arr = arr.sort((a, b) => {
          if (upOrDown === "asc") {
            return a.hydration.min - b.hydration.min;
          } else {
            return b.hydration.min - a.hydration.min;
          }
        });
        return arr;
      case "hydration-max":
        arr = arr.sort((a, b) => {
          if (upOrDown === "asc") {
            return a.hydration.max - b.hydration.max;
          } else {
            return b.hydration.max - a.hydration.max;
          }
        });
        return arr;
      case "nutrient":
        arr = arr.sort((a, b) => {
          return a.nutrient > b.nutrient ? 1 : a.nutrient === b.nutrient ? 0 : -1;
        });
        return arr;
      default:
        return arr;
    }
  });

  function switchUpDown() {
    upOrDown = upOrDown === "asc" ? "desc" : "asc";
  }

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
</script>

<svelte:window onkeydown={onkeydown} />

<main class="w-screen">
  <table class="w-full p-12">
    <thead class="m-4 text-center">
      <tr class="m-4 grid grid-cols-4 items-center justify-between text-lg font-black capitalize">
        <td>Name</td>
        <td class="flex flex-col">
          <div>temperature</div>
          <div class="grid grid-cols-2">
            <button
              class="cursor-pointer"
              onclick={() => {
                order = "temperature-min";
                switchUpDown();
              }}>Min</button
            >
            <button
              class="cursor-pointer"
              onclick={() => {
                order = "temperature-max";
                switchUpDown();
              }}>Max</button
            >
          </div>
        </td>
        <td class="flex flex-col">
          <div>Hydration</div>
          <div class="grid grid-cols-2">
            <button
              class="cursor-pointer"
              onclick={() => {
                order = "hydration-min";
                switchUpDown();
              }}>Min</button
            >
            <button
              class="cursor-pointer"
              onclick={() => {
                order = "hydration-max";
                switchUpDown();
              }}>Max</button
            >
          </div>
        </td>
        <td
          onclick={() => {
            order = "nutrient";
            switchUpDown();
          }}>Nutrient</td
        >
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
