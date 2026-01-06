<script lang="ts">
  type OresType = "small" | "poor" | "normal" | "rich";

  const oresAmount = { smallAmount: 10, poorAmount: 15, normalAmount: 25, richAmount: 35 };

  const initialOres = {
    name: "Ore name here",
    individual: {
      small: 0,
      poor: 0,
      normal: 0,
      rich: 0,
    },
    stack: {
      small: 0,
      poor: 0,
      normal: 0,
      rich: 0,
    },
  };

  let ores = $state([initialOres]);
  let stackAmount = $state([128]);

  let result = $derived.by(() => {
    return ores.map((ore, index) => {
      const { smallAmount, poorAmount, normalAmount, richAmount } = oresAmount;
      const { small: iSmall, poor: iPoor, normal: iNormal, rich: iRich } = ore.individual;
      const { small: sSmall, poor: sPoor, normal: sNormal, rich: sRich } = ore.stack;

      const stackValue = stackAmount[index];

      const amount =
        iSmall * smallAmount +
        iNormal * normalAmount +
        iPoor * poorAmount +
        iRich * richAmount +
        sSmall * stackValue * smallAmount +
        sNormal * stackValue * normalAmount +
        sPoor * stackValue * poorAmount +
        sRich * stackValue * richAmount;
      return amount;
    });
  });
</script>

<main class="flex min-h-screen flex-col gap-2 bg-gray-800 px-4 pt-2">
  <div class="">
    <button
      class="mx-auto w-full cursor-pointer rounded bg-sky-700 py-2 text-xs font-bold text-white uppercase"
      onclick={() => {
        ores.push(initialOres);
        stackAmount.push(128);
      }}>New one</button
    >
  </div>
  <div class="grid grid-cols-{ores.length < 3 ? ores.length : 3} gap-4">
    {#each ores as ore, index}
      {@const mbAmount = result[index]}
      <div class="flex flex-col gap-2 rounded-2xl bg-white p-4">
        <label class="flex justify-between gap-4">
          <input type="text" class="w-full rounded" bind:value={ore.name} />
          <button
            onclick={() => {
              const arr = ores.filter((_, idx) => idx !== index);
              ores = arr;
            }}
            class="cursor-pointer rounded bg-red-800 px-2 py-1 font-semibold text-white uppercase"
            >Remove</button
          >
        </label>
        <div class="flex gap-4">
          <div>
            <h3>Individual</h3>
            {#each Object.entries(ore.individual) as [key]}
              {@const individual = ore.individual}
              {@const params = key as "poor" | "small" | "normal" | "rich"}
              <div class="flex justify-between">
                {key}:
                <input type="number" min="0" bind:value={individual[params]} />
              </div>
            {/each}
          </div>
          <div>
            <div class="flex justify-between">
              <h3>Stack</h3>
              <input type="number" class="font-semibold!" bind:value={stackAmount[index]} />
            </div>
            {#each Object.entries(ore.stack) as [key]}
              {@const stack = ore.stack}
              {@const params = key as "poor" | "small" | "normal" | "rich"}
              <div class="flex justify-between">
                {key}:
                <input type="number" min="0" bind:value={stack[params]} />
              </div>
            {/each}
          </div>
        </div>
        <hr class="my-1" />
        <div class="flex justify-around">
          <p>
            {mbAmount}mb
          </p>
          <p>
            {Math.floor(mbAmount / 100)}ingots ({mbAmount % 100})
          </p>
        </div>
      </div>
    {/each}
  </div>
</main>

<style>
  input[type="number"] {
    all: unset;
    appearance: none;
    -moz-appearance: textfield;
    width: 30%;
    border-style: none;
    text-align: end;
  }
  h3 {
    font-weight: 800;
  }
</style>
