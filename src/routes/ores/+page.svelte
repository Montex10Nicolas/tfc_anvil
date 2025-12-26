<script lang="ts">
  let oreMLAmount = $state({
    small: 10,
    poor: 15,
    normal: 25,
    rich: 35,
  });

  let oreAmount = $state({
    small: 0,
    poor: 0,
    normal: 0,
    rich: 0,
  });

  let stackAmount = $state(128);
  let stacks = $state({
    small: 0,
    poor: 0,
    normal: 0,
    rich: 0,
  });

  let total = $derived(
    oreMLAmount.small * oreAmount.small +
      oreMLAmount.poor * oreAmount.poor +
      oreMLAmount.normal * oreAmount.normal +
      oreMLAmount.rich * oreAmount.rich,
  );

  function resetAll() {
    oreAmount = {
      small: 0,
      poor: 0,
      normal: 0,
      rich: 0,
    };
    stacks = oreAmount;
  }
</script>

<main class="flex min-h-screen w-screen flex-col items-center justify-center gap-6 bg-black/80">
  <div class="relative flex justify-between rounded-2xl bg-white p-8 text-lg">
    <div class="absolute top-2 right-2">
      <button class="cursor-pointer" onclick={resetAll}>🧹</button>
    </div>
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
    <div>
      <p class="font-bold">
        Stacks
        <input
          class="w-1/6! rounded! border-2! bg-gray-800! px-2! py-1! text-center! text-white!"
          type="number"
          bind:value={
            () => stackAmount,
            (value) => {
              oreAmount.small = stacks.small * value;
              oreAmount.normal = stacks.normal * value;
              oreAmount.poor = stacks.poor * value;
              oreAmount.rich = stacks.rich * value;
              stackAmount = value;
            }
          }
        />
      </p>
      <label class="flex items-center justify-around"
        >small:

        <input
          type="number"
          min="0"
          bind:value={
            () => stacks.small,
            (value) => {
              stacks.small = value;
              oreAmount.small = value * stackAmount;
            }
          }
        />
        qt</label
      >
      <label class="flex items-center justify-around">
        poor:
        <input
          type="number"
          min="0"
          bind:value={
            () => stacks.poor,
            (value) => {
              stacks.poor = value;
              oreAmount.poor = value * stackAmount;
            }
          }
        />
      </label>

      <label class="flex items-center justify-around"
        >Normal:

        <input
          type="number"
          min="0"
          bind:value={
            () => stacks.normal,
            (value) => {
              stacks.normal = value;
              oreAmount.normal = value * stackAmount;
            }
          }
        />
        qt</label
      >
      <label class="flex items-center justify-around">
        Rich:
        <input
          type="number"
          min="0"
          bind:value={
            () => stacks.rich,
            (value) => {
              stacks.rich = value;
              oreAmount.rich = value * stackAmount;
            }
          }
        />
      </label>
    </div>
  </div>
  <div class="flex justify-between rounded-2xl bg-white p-4 text-2xl">
    <h2>
      {total}ml | {Math.floor(total / 100)}ingots | {total - Math.floor(total / 100) * 100}remaining
    </h2>
  </div>
</main>

<style>
  input[type="number"] {
    all: unset;
    appearance: none;
    -moz-appearance: textfield;
    width: 30%;
    border-style: none;
  }
</style>
