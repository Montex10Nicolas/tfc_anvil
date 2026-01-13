<script lang="ts">
  import {
    getWorlds,
    createWorld,
    getMetals,
    createMetal,
    createItem,
    getInputItems,
  } from "./data.remote";
  import { SvelteSet } from "svelte/reactivity";
  import { useSearchParams } from "runed/kit";
  import * as v from "valibot";
  import { onClickOutside } from "runed";
  import type { Attachment } from "svelte/attachments";
  import { onMount } from "svelte";

  const LOCAL_STORAGE_KEY = {
    world: "world",
  };

  let modal = $state<HTMLElement>()!;
  onClickOutside(
    () => modal,
    () => {
      if (worldValue === "new_one") {
        worldValue = "";
      } else if (metalValue === "new_one") {
        metalValue = "";
      }
    },
  );

  const params = useSearchParams(
    v.object({
      world: v.optional(v.string(), ""),
      metal: v.optional(v.string(), ""),
      inputName: v.optional(
        v.enum({
          ingot: "ingot",
          double_ingot: "double ingot",
          sheet: "sheet",
          double_sheet: "double sheet",
          rod: "rod",
        }),
        "ingot",
      ),
    }),
  );

  const possibility = [-3, -6, -9, -15, 2, 7, 13, 16] as const;
  const worldQuery = $derived(await getWorlds());
  const metalQuery = $derived(await getMetals());
  const inputItems = await getInputItems();

  let queue: number[] = $state([]);
  type PossibileHits = -1 | -15 | 2 | 7 | 13 | 16 | 0;
  let finishHits: {
    last: PossibileHits;
    secondLast: PossibileHits;
    thirdLast: PossibileHits;
  } = $state({
    last: 0,
    secondLast: 0,
    thirdLast: 0,
  });

  let worldValue = $derived(params.world);

  let metalValue = $state(params.metal);
  let inputItem = $state(params.inputName);

  let itemName = $state("");
  let endPoint = $state(0);

  let htmlNameItem: HTMLInputElement;

  let toReach = $derived.by(() => {
    let starting = [endPoint ?? 0, endPoint ?? 0, endPoint ?? 0];
    if (endPoint <= 0) return starting;
    const { last, secondLast, thirdLast } = finishHits;
    let isMultipleOptions = false;
    for (const hit of [last, secondLast, thirdLast]) {
      switch (hit) {
        case 0:
          break;
        case -1:
          isMultipleOptions = true;
          starting = [starting[0] + 3, starting[1] + 6, starting[2] + 9];
          break;
        default:
          starting = starting.map((value) => {
            return (value += hit * -1);
          });
      }
    }

    if (isMultipleOptions) {
      return starting;
    }

    return [starting[0]];
  });

  let queueDisplay = $derived.by(() => {
    let temp = [...queue];
    for (const hit of [finishHits.thirdLast, finishHits.secondLast, finishHits.last]) {
      if (hit === 0) continue;
      if (hit !== -1) {
        temp.push(hit);
        continue;
      }

      const dumbArray = [-3, -6, -9] as const;
      for (let i = 0; i < toReach.length; i++) {
        const value = toReach[i];
        if (current === value) {
          temp.push(dumbArray[i]);
          break;
        } else if (i + 1 == toReach.length) {
          temp.push(369);
        }
      }
    }
    return temp;
  });

  let current = $derived.by(() => {
    let value = 0;
    queue.map((v) => (value += v));
    return value;
  });

  function handleButtons(value: number) {
    const newValue = current + value;
    if (newValue < 0) return;
    current = newValue;
    queue.push(value);
  }

  async function itemCreation() {
    const { last, secondLast, thirdLast } = finishHits;

    const worldFound = worldQuery.find((world) => {
      if (world.name === worldValue) return world;
    })!;

    const metalFound = metalQuery.find((metal) => {
      if (metal.name === metalValue) return metal;
    })!;

    await createItem({
      name: itemName,
      metalID: metalFound.id,
      worldID: worldFound.id,
      itemInput: inputItem,
      path: queueDisplay,
      actions: [last, secondLast, thirdLast],
    });
    itemName = "";
    endPoint = 0;
    toReach = [0, 0, 0];
    finishHits = {
      last: 0,
      secondLast: 0,
      thirdLast: 0,
    };
    clearQueue();
    htmlNameItem.focus();
  }

  function clearQueue() {
    queue = [];
  }

  function autohammerize() {
    let bestPath: number[] | null;
    if (toReach[0] != toReach[1]) {
      const paths = [
        { name: "bp0", value: bfs(toReach[0]) },
        { name: "bp1", value: bfs(toReach[1]) },
        { name: "bp2", value: bfs(toReach[2]) },
      ];
      bestPath =
        paths
          .filter((e) => Array.isArray(e.value))
          .sort((a, b) => a.value!.length - b.value!.length)[0].value ?? null;
    } else bestPath = bfs(toReach[0]);
    if (bestPath != null) queue = bestPath;
    else clearQueue();
  }

  function bfs(target: number): number[] | null {
    const moves = [-3, -6, -9, -15, +2, +7, +13, +16];

    const MIN = 0; // prevents moves that break the item
    const MAX = target + 16; // let the bfs go a bit over

    const queue: Array<{ value: number; path: number[] }> = [];
    const visited = new SvelteSet<number>();

    queue.push({ value: 0, path: [] });
    visited.add(0);

    while (queue.length > 0) {
      const { value, path } = queue.shift()!;

      if (value === target) return path;

      for (const move of moves) {
        const next = value + move;

        if (next < MIN || next > MAX) continue;
        if (visited.has(next)) continue;

        visited.add(next);
        queue.push({ value: next, path: [...path, move] });
      }
    }

    return null;
  }

  const focusMeAttach: Attachment = (node) => {
    if (node.nodeName === "INPUT") {
      const input = node as HTMLInputElement;
      input.focus();
    }
  };

  onMount(() => {
    if (params.world) {
      localStorage.setItem(LOCAL_STORAGE_KEY.world, params.world);
    } else {
      const localWorld = localStorage.getItem(LOCAL_STORAGE_KEY.world);
      if (localWorld === null) return;
      params.world = localWorld;
    }
  });
</script>

<svelte:window
  onkeydown={(k) => {
    const target = k.target as HTMLElement;
    if (target.tagName === "INPUT") return;

    const key = k.key;
    if (key.toLowerCase() === "backspace") {
      queue = queue.slice(0, queue.length - 1);
    }
  }}
/>

<main class="flex min-h-screen w-screen flex-col items-center gap-4 bg-gray-800 py-4">
  <!-- Numbers -->
  <section
    class="flex max-h-24 min-h-24 w-[72%] flex-col justify-around rounded-2xl bg-white py-2 sm:w-[50%] lg:max-w-[30%]"
  >
    <div class="relative flex justify-between gap-x-1 overflow-scroll">
      <button
        onclick={() => {
          queue = queue.slice(0, queue.length - 1);
        }}>🔙</button
      >
      <div class="flex max-w-2/3 min-w-2/3 flex-wrap items-center gap-x-2 gap-y-0 overflow-scroll">
        {#each queueDisplay as value, idx (`queueDisplay-${idx}-${value}`)}
          <p class="text-md font-semibold">{value}</p>
        {/each}
      </div>
      <button onclick={clearQueue}>🚮</button>
    </div>

    <!-- Progress -->
    {#if toReach}
      <div class="flex items-center px-2">
        {#each new Array(145), index}
          {@const status = () => {
            if (current === index) {
              if (toReach.find((i) => i === index)) {
                return "found";
              } else {
                return "current";
              }
            } else {
              if (toReach.find((i) => i === index)) {
                return "target";
              } else {
                return "any";
              }
            }
          }}
          {@const bgColor =
            status() === "found"
              ? "bg-amber-600"
              : status() === "current"
                ? "bg-sky-600"
                : status() === "target"
                  ? "bg-white"
                  : "bg-black"}
          <span style="" class="h-4 w-1 {bgColor}"></span>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Item info -->
  <section class="flex flex-col gap-y-4 rounded-2xl bg-white p-6 text-black">
    <input
      bind:this={htmlNameItem}
      bind:value={itemName}
      class="rounded"
      placeholder="Item name"
      {@attach focusMeAttach}
    />
    <div class="grid grid-cols-2 gap-4">
      {#if worldQuery}
        <label class="flex flex-col">
          World:
          <select
            class="cursor-pointer rounded"
            bind:value={
              () => worldValue,
              (v) => {
                if (v !== "new_one") {
                  localStorage!.setItem(LOCAL_STORAGE_KEY.world, v);
                }
                worldValue = v;
              }
            }
            placeholder="World"
          >
            {#each worldQuery as { id, name } (id)}
              <option value={name}>{name}</option>
            {/each}
            <option value="new_one">Create new one</option>
          </select>
        </label>
        {#if worldValue === "new_one"}
          <div
            class="absolute top-0 left-0 z-100 flex h-screen w-screen items-center justify-center bg-black/60"
          >
            <form
              bind:this={modal}
              {...createWorld}
              onsubmit={() => {
                worldValue = "";
              }}
              class="relative flex flex-col gap-4 rounded-2xl bg-white p-16"
            >
              <button type="button" class="absolute top-1 right-1" onclick={() => (worldValue = "")}
                >❌</button
              >
              <label class="flex flex-col">
                <input
                  {@attach focusMeAttach}
                  {...createWorld.fields.name.as("text")}
                  placeholder="World Name"
                />
              </label>
              <div class="w-full">
                <button
                  class="w-full rounded bg-green-700 py-2 text-center font-bold text-amber-50 uppercase"
                  type="submit">Save</button
                >
              </div>
            </form>
          </div>
        {/if}
      {:else}
        <form {...createWorld}>
          bind:this={modal}
          <input
            {@attach focusMeAttach}
            {...createWorld.fields.name.as("text")}
            placeholder="World identifier"
          />
        </form>
      {/if}

      <div>
        <form>
          <label class="flex flex-col">
            Metal
            <select class="cursor-pointer rounded" bind:value={metalValue}>
              {#each metalQuery as { name, id } (id)}
                <option value={name}>{name}</option>
              {/each}
              <option value="new_one">Create new one</option>
            </select>
          </label>
        </form>
      </div>
      {#if metalValue === "new_one"}
        <div
          class="absolute top-0 left-0 flex h-screen w-screen items-center justify-center bg-black/60"
        >
          <form
            bind:this={modal}
            {...createMetal}
            onsubmit={() => {
              metalValue = "";
            }}
            class="relative z-99 flex flex-col gap-4 rounded-2xl bg-white p-16"
          >
            <button type="button" class="absolute top-1 right-1" onclick={() => (metalValue = "")}
              >❌</button
            >
            <label class="flex flex-col">
              <input
                {@attach focusMeAttach}
                {...createMetal.fields.name.as("text")}
                placeholder="Metal"
              />
            </label>
            <div class="w-full">
              <button
                class="w-full rounded bg-green-700 py-2 text-center font-bold text-amber-50 uppercase"
                type="submit">Save</button
              >
            </div>
          </form>
        </div>
      {/if}

      <label class="col-span-2 flex flex-col">
        Material:
        <select bind:value={inputItem} class="cursor-pointer rounded">
          {#each inputItems as materials (materials)}
            <option value={materials.name}>
              {materials.name}
            </option>
          {/each}
        </select>
      </label>
    </div>
  </section>

  <!-- pad -->
  <section class="relative rounded-2xl bg-white p-8">
    <div class="flex justify-between">
      <label class="flex flex-col items-center justify-between gap-2">
        <p class="text-sm">End point:</p>
        <input
          class="text cursor-pointer rounded px-2 py-1 text-center font-semibold"
          type="number"
          min="0"
          max="160"
          bind:value={
            () => endPoint,
            (value) => {
              if (value > 200) {
                endPoint = 200;
                return;
              } else if (value < 0) {
                endPoint = 0;
                return;
              }
              endPoint = value;
            }
          }
        />
      </label>
      <div class="flex flex-col items-center gap-1">
        <p class="text-sm">To reach:</p>
        <div class="flex gap-3">
          {#each toReach as end, idx (`toReach--${idx}-${end}`)}
            <div class="grid h-8 w-12 place-items-center rounded border text-lg font-semibold">
              <p>
                {end}
              </p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    {#if finishHits}
      <div class="flex justify-between">
        <label>
          last
          <section>
            <select class="cursor-pointer rounded" bind:value={finishHits.last}>
              {#each [0, -1, -15, 2, 7, 13, 16] as hit (`last-hit-${hit}`)}
                <option value={hit}>{hit === 0 ? "none" : hit === -1 ? "hit" : hit}</option>
              {/each}
            </select>
          </section>
        </label>
        <label>
          second last
          <section>
            <select class="cursor-pointer rounded" bind:value={finishHits.secondLast}>
              {#each [0, -1, -15, 2, 7, 13, 16] as hit (`second-hit-${hit}`)}
                <option value={hit}>{hit === 0 ? "none" : hit === -1 ? "hit" : hit}</option>
              {/each}
            </select>
          </section>
        </label>
        <label>
          third last
          <section>
            <select class="cursor-pointer rounded" bind:value={finishHits.thirdLast}>
              {#each [0, -1, -15, 2, 7, 13, 16] as hit (`third-hit-${hit}`)}
                <option value={hit}>{hit === 0 ? "none" : hit === -1 ? "hit" : hit}</option>
              {/each}
            </select>
          </section>
        </label>
      </div>
    {/if}

    <div class="flex items-center gap-4">
      <div class="grid grid-cols-2 gap-2">
        {#each possibility.filter((x) => x < 0) as anvilValue, idx (`lessThan-${idx}-${anvilValue}`)}
          <button class="border px-1 py-1" onclick={() => handleButtons(anvilValue)}
            >{anvilValue}</button
          >
        {/each}
      </div>
      <div class="flex min-w-37.5 flex-col">
        <p class="text-center text-7xl font-bold">{current ?? 0}</p>
        <p class="flex flex-col text-center text-lg font-medium">
          {queue.length}<span class="text-xs font-light uppercase">Steps</span>
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        {#each possibility.filter((x) => x > 0) as anvilValue, idx (`greaterThan-${idx}-${anvilValue}`)}
          <button class="border px-1 py-1" onclick={() => handleButtons(anvilValue)}
            >{anvilValue}</button
          >
        {/each}
      </div>
    </div>

    <div class="absolute right-3 bottom-2 cursor-pointer rounded border p-0 text-xs">
      <button tabindex="-1" class="text-xs" onclick={autohammerize}>🖥️</button>
    </div>
  </section>
  <div class="w-1/4">
    <button
      disabled={current === 0 || toReach.findIndex((v) => v === current) === -1}
      class="w-full rounded bg-green-700 py-2 text-center font-black text-amber-50 uppercase disabled:cursor-default disabled:bg-gray-950"
      onclick={itemCreation}>Create Item</button
    >
  </div>
</main>

<style>
  button {
    cursor: pointer;
    min-width: 40px;
    font-weight: 500;
    font-size: 20px;
    border-radius: 4px;
  }
</style>
