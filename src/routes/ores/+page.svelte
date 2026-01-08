<script lang="ts">
  // Idk if this will ever be relevant
  // type OresType = "small" | "poor" | "normal" | "rich";

  const oresAmount = { smallAmount: 10, poorAmount: 15, normalAmount: 25, richAmount: 35 };

  const initialOres = {
    name: "",
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

      const individualAmount = iSmall + iPoor + iNormal + iRich;
      const stackedAmount = (sSmall + sPoor + sNormal + sRich) * stackValue;
      const totalAmount = individualAmount + stackedAmount;

      const amountInMl =
        iSmall * smallAmount +
        iNormal * normalAmount +
        iPoor * poorAmount +
        iRich * richAmount +
        sSmall * stackValue * smallAmount +
        sNormal * stackValue * normalAmount +
        sPoor * stackValue * poorAmount +
        sRich * stackValue * richAmount;
      return [amountInMl, totalAmount] as const;
    });
  });
</script>

{#snippet thingy(
  ores: typeof initialOres.individual,
  { index, stacked }: { index?: number; stacked?: boolean },
)}
  {#each Object.entries(ores) as [key]}
    {@const params = key as "poor" | "small" | "normal" | "rich"}
    <div class="flex justify-between">
      <span class="font-semibold capitalize">
        {key}: {stacked ? ores[params] * stackAmount[index!] : null}
      </span>
      <input type="number" min="0" bind:value={ores[params]} />
    </div>
  {/each}
{/snippet}

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
      {@const [mbAmount, totalItems] = result[index]}
      {@const ingots = Math.floor(mbAmount / 100)}
      <div class="flex flex-col gap-2 rounded-2xl bg-white p-4">
        <label class="flex justify-between gap-4">
          <input
            placeholder="Change me :("
            type="text"
            class="w-full rounded"
            bind:value={ore.name}
            {@attach (node) => {
              if (index === 0) node.focus();
            }}
          />
          <button
            onclick={() => {
              const arr = ores.filter((_, idx) => idx !== index);
              ores = arr;
            }}
            tabindex="-1"
            class="cursor-pointer rounded bg-red-800 px-2 py-1 font-semibold text-white uppercase"
            >Remove</button
          >
        </label>
        <div class="flex gap-4">
          <div>
            <h3>Individual</h3>
            {@render thingy(ore.individual, {})}
          </div>
          <div>
            <div class="flex justify-between">
              <h3>Stack</h3>
              <input type="number" class="font-semibold!" bind:value={stackAmount[index]} />
            </div>
            {@render thingy(ore.stack, { index, stacked: true })}
          </div>
        </div>
        <hr class="my-1" />
        <div class="{ores.length > 2 ? 'grid grid-cols-3' : 'flex'}  justify-around font-bold">
          <p>
            {mbAmount}mb
          </p>
          <p>
            {ingots}<small>ingots</small> ({mbAmount % 100})
          </p>
          <p>
            {totalItems}items
          </p>
          <p>
            {Math.floor(ingots / 64)} - {ingots % 64}<small>64s</small>
          </p>
          <p>
            {Math.floor(ingots / 256)}<small>256s</small>
          </p>
          <p>
            {Math.floor(ingots / 1280)}<small>1280s</small>
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
