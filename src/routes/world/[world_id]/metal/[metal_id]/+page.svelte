<script lang="ts">
  import type { ItemDBSelect } from "$lib/server/db/schema.js";
  import { onClickOutside } from "runed";
  import {
    getInputItems,
    getItems,
    getMetals,
    removeItem,
    updateItem,
  } from "../../../../data.remote";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { onMount } from "svelte";

  //TODO: Try remote functions

  let { data } = $props();
  let { world_id, metal_id } = $derived(data);

  const items = $derived(await getItems({ worldId: world_id, metalId: metal_id }));
  const inputItems = await getInputItems();
  const metals = await getMetals();

  let metalName = $derived(metals.find((v) => v.id === metal_id)!.name);

  const hideArray: boolean[] = $state(new Array(items.length).fill(false));
  let modal = $state<HTMLElement>()!;

  let editing: {
    item?: ItemDBSelect;
    editing: boolean;
    path: number[];
  } = $state({
    editing: false,
    path: [],
  });

  editing = { item: items[0], editing: true, path: items[0].path };

  let filter = $state("");
  let sortInput = $state("");
  let groupped = $state(true);

  onClickOutside(
    () => modal,
    () => {
      editing.editing = false;
    },
  );

  let pinnedID = new SvelteSet<string>();
  let globallyPinned: Array<(typeof items)[0]> = $state([]);
  let pinnedAmount = new SvelteMap<string, number>();

  let sorted = $derived.by(() => {
    const globallyPinnedID = new Set<string>();
    globallyPinned.map((v) => {
      globallyPinnedID.add(v.id);
    });

    let arr = items.filter((item) => {
      const { id } = item;
      if (globallyPinnedID.has(id) || pinnedID.has(id)) return;
      return item;
    });

    const sortedBy = sortInput.toLowerCase();

    if (sortedBy !== "") {
      arr = arr.filter((v) => {
        if (v.inputItemName === sortedBy) {
          return v;
        }
      });
    }

    if (filter === "") return arr;

    const founds = arr.filter((item) => {
      if (item.name.toLowerCase().includes(filter.toLowerCase())) {
        return item;
      }
    });

    return founds;
  });

  let pinned = $derived(
    items.filter((item) => {
      if (pinnedID.has(item.id)) return item;
    }),
  );

  let ingotsNeededInMl = $derived.by(() => {
    const itemsByMetal = new Map<string, number>();

    const unifiedPinned = [...pinned, ...globallyPinned];

    unifiedPinned.map((item) => {
      const { inputItemName, metal_id: metalItem } = item;
      const metalNameAAA = getMetalName(metalItem);

      if (metalNameAAA === undefined) return;
      let current = itemsByMetal.get(metalNameAAA) ?? 0;

      const amountInML =
        inputItems.find((input) => {
          if (input.name === inputItemName) return input;
        })?.inMillibuckets ?? 0;

      const amount = pinnedAmount.get(item.id) ?? 1;

      itemsByMetal.set(metalNameAAA, current + amountInML * amount);
    });

    return itemsByMetal;
  });

  function getMetalName(id: string) {
    const found = metals.find((value) => {
      if (value.id === id) return value;
    });
    return found?.name;
  }

  function handleGloballyPinned({ item }: { item: (typeof items)[0] }) {
    const itemsInStorage = localStorage.getItem("pinned_global");
    if (itemsInStorage === null) {
      localStorage.setItem("pinned_global", JSON.stringify([item]));
      globallyPinned = [item];
      pinnedID.delete(item.id);
      return;
    }

    const storedItems: typeof globallyPinned = JSON.parse(itemsInStorage);

    let found = storedItems.find((value) => {
      return value.id === item.id;
    });

    if (found !== undefined) return;

    storedItems.push(item);
    localStorage.setItem("pinned_global", JSON.stringify(storedItems));

    globallyPinned = [...storedItems];
    pinnedID.delete(item.id);
  }

  function onkeydown(
    event: KeyboardEvent & {
      currentTarget: EventTarget & Window;
    },
  ) {
    const { key, ctrlKey } = event;
    const uglyKeys = ["Control", "Shift", "Enter"];

    for (const ugly of uglyKeys) {
      if (key === ugly) return;
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

  onMount(() => {
    if (!localStorage) return;
    const itemsInStorage = localStorage.getItem("pinned_global");
    if (itemsInStorage === null) return [];

    const globalItems: Array<(typeof items)[0]> = JSON.parse(itemsInStorage);
    globallyPinned = globalItems;
  });
</script>

<svelte:window onkeydown={editing.editing ? null : onkeydown} />

{#snippet displayItem({
  item,
  index = 0,
  isPinned,
  isGlobal,
}: {
  item: (typeof items)[0];
  index?: number;
  isPinned?: boolean;
  isGlobal?: boolean;
})}
  {@const {
    name,
    id: itemID,
    inputItemName,
    metal_id,
    path,
    world_id,
    lastAction,
    secondAction,
    thirdAction,
  } = item}
  {@const pathTotal = path.reduce((pre, curr) => {
    return curr + pre;
  })}
  {@const lastValue = lastAction === null ? 0 : path[path.length - 1]}
  {@const secondValue = secondAction === null ? 0 : path[path.length - 2]}
  {@const thirdValue = thirdAction === null ? 0 : path[path.length - 3]}
  <div class="rounded-2xl bg-white p-6">
    <div>
      <div class="flex justify-between">
        <p class="text-lg font-bold capitalize">
          {name}
          {isGlobal
            ? metals.find((value) => {
                if (value.id === metal_id) return value.name;
              })?.name
            : metalName}
        </p>
        <div>
          {#if !isPinned}
            <button
              class="cursor-pointer"
              onclick={() => {
                pinnedID.add(itemID);
                pinnedAmount.set(item.id, 1);
              }}>📌</button
            >
          {:else}
            <button
              class="cursor-pointer"
              style="color: transparent; text-shadow: 0 0 0 {isGlobal ? 'red' : 'blue'}"
              onclick={() => handleGloballyPinned({ item })}
            >
              🌐
            </button>
          {/if}
          <button
            class="cursor-pointer"
            onclick={() =>
              (editing = {
                item: {
                  id: itemID,
                  name,
                  path,
                  inputItemName,
                  world_id,
                  metal_id,
                  lastAction,
                  secondAction,
                  thirdAction,
                },
                editing: true,
                path: path,
              })}>✏️</button
          >
          <button
            class="cursor-pointer"
            onclick={async () => {
              if (isPinned && !isGlobal) {
                pinnedID.delete(itemID);
              } else if (!isGlobal) {
                hideArray[index] = true;
                await removeItem(itemID);
              } else if (isGlobal) {
                const indexItem = globallyPinned.findIndex((value, index) => {
                  if (value.id === itemID) {
                    return index;
                  }
                });

                const copy = [...globallyPinned];
                copy.splice(indexItem, 1);
                globallyPinned = copy;
                localStorage.setItem("pinned_global", JSON.stringify(copy));
                pinnedID.delete(itemID);
              }
            }}
          >
            ❌
          </button>
        </div>
      </div>

      <div class="flex w-[80%] flex-wrap items-center gap-1 text-lg">
        {#each path as value, index}
          <div class="">
            <p class="text-end text-[0.6rem]">{index + 1}</p>
            <p>{value}</p>
          </div>
        {/each}
        <p>({pathTotal})</p>
      </div>
      <div class="flex justify-between">
        <div class="flex gap-8 text-center text-2xl font-bold">
          <!-- <p>Last: {lastValue} | Second: {secondValue} | Third: {thirdValue}</p> -->
          <p>({pathTotal - lastValue - secondValue - thirdValue})</p>
          <p class="">
            {[...path]
              .slice(
                0,
                path.findIndex((value, index) => {
                  if (value !== 16) return index;
                }),
              )
              .reduce((acc, cur) => acc + cur, 0)}
          </p>
          {#if isPinned}
            <p class="">
              <button
                class="cursor-pointer"
                onclick={() => {
                  const curr = pinnedAmount.get(item.id) ?? 1;
                  if (curr === 0) return;
                  pinnedAmount.set(item.id, curr - 1);
                }}>-</button
              >
              <span>{pinnedAmount.has(item.id) ? pinnedAmount.get(item.id) : 1}</span>
              <button
                class="cursor-pointer"
                onclick={() => {
                  const curr = pinnedAmount.get(item.id) ?? 1;
                  pinnedAmount.set(item.id, curr + 1);
                }}>+</button
              >
            </p>
          {/if}
        </div>
        <p class="text-2xl font-black">
          {inputItemName}
        </p>
      </div>
    </div>
  </div>
{/snippet}

<!-- debugging -->
<!-- <div class="absolute right-0 bottom-0 m-1 border border-black bg-white p-8"> -->
<!-- 	<dev class="flex flex-col"> -->
<!-- 		<code> {JSON.stringify(pinned, null, 2)}</code> -->
<!-- 		<code> {JSON.stringify(globallyPinned, null, 2)}</code> -->
<!-- 		<code> {JSON.stringify(ingotsNeededInMl, null, 2)}</code> -->
<!-- 	</dev> -->
<!-- </div> -->

<main
  class="min-h-screen min-w-screen bg-black/80 pt-1 pb-2 {editing.editing
    ? 'max-h-screen overflow-hidden'
    : ''}"
>
  <div class="m-4 flex items-center justify-between">
    <a href="/world/{world_id}">
      <h1 class="cursor-pointer font-semibold text-violet-300">⬅️ Go back to metal selection</h1>
    </a>
    <h2 class="text-2xl font-bold text-white">{metalName}</h2>
  </div>
  <div class="m-4 flex items-center space-x-4 rounded bg-white px-4 py-2">
    <label class="flex flex-col items-center">
      <span> Filter by Input Item: </span>
      <select bind:value={sortInput} class="cursor-pointer rounded font-semibold capitalize">
        <option value=""> none</option>
        {#each inputItems as item}
          <option value={item.name}>
            {item.name}
          </option>
        {/each}
      </select>
    </label>
    <div class="flex gap-8">
      <label class="flex flex-col items-center gap-2">
        <p>Groupped</p>
        <input
          type="checkbox"
          class="min-h-8 w-full cursor-pointer rounded"
          bind:checked={groupped}
        />
      </label>
    </div>
    <div class="h-32 max-h-12 w-1 border bg-black"></div>
    <p class="text-lg font-bold">{filter}</p>
  </div>

  <!-- Pinned -->
  {#if pinnedID.size || globallyPinned.length}
    {@const size = pinnedID.size + globallyPinned.length}

    <div class="m-4">
      <h3 class="my-2 rounded bg-sky-600 p-3 text-xl font-bold text-white">Pinned</h3>
      <div class="flex items-center justify-between">
        <div
          class="grid w-[80%] grid-cols-{ingotsNeededInMl.size < 4
            ? ingotsNeededInMl.size
            : 4} gap-x-2"
        >
          {#each ingotsNeededInMl as [metalNamee, amount]}
            <div class="my-2 w-full rounded bg-white p-2 text-2xl font-bold">
              <p>{metalNamee}: {amount / 100}({amount}ml)</p>
            </div>
          {/each}
        </div>
        <div class="flex gap-8">
          <button
            class="my-2 cursor-pointer rounded bg-purple-600 px-4 py-4 font-bold text-white uppercase"
            onclick={() => {
              pinned.forEach((item) => {
                handleGloballyPinned({ item });
              });
            }}>Save</button
          >
          <button
            class="my-2 cursor-pointer rounded bg-red-600 px-4 py-4 font-bold text-white uppercase"
            onclick={() => {
              [...pinned, ...globallyPinned].map((item) => {
                const { id: itemID } = item;
                pinnedID.delete(itemID);
              });
              globallyPinned = [];
              pinned = [];
              localStorage.setItem("pinned_global", JSON.stringify([]));
            }}>Remove</button
          >
        </div>
      </div>
      <div class="grid grid-cols-{size > 3 ? 3 : size} gap-8">
        {#each pinned as item, index}
          {@render displayItem({ item, index, isPinned: true })}
        {/each}
        {#each globallyPinned as item, index}
          {@render displayItem({ item, index, isPinned: true, isGlobal: true })}
        {/each}
      </div>
    </div>
    <hr class="mx-4 my-4 mt-4 min-h-4 bg-amber-400" />
  {/if}
  <!-- end pinned -->

  {#if !groupped}
    <div class="mx-4 mt-4 grid grid-cols-3 gap-8 pb-8">
      {#each sorted as item, index}
        {#if !hideArray[index]}
          {@render displayItem({ item, index })}
        {/if}
      {/each}
      <a href="/?world={world_id}&metal={metal_id}">
        <div class="relative flex h-full items-center gap-2 rounded-2xl bg-sky-300 p-6">
          <span class="text-4xl">🆕</span>
          <p class="text-2xl font-bold">Create a new one</p>
        </div>
      </a>
    </div>
  {:else}
    {#each inputItems as value}
      {@const grouppedItems = sorted.filter((v) => {
        return v.inputItemName === value.name;
      })}
      {#if grouppedItems.length}
        <h1 class="mx-4 rounded bg-sky-600 px-4 py-2 text-4xl font-bold text-white capitalize">
          {value.name}
        </h1>
        <div class="m-4 grid grid-cols-3 gap-8">
          {#each grouppedItems as item, index}
            {#if !hideArray[index]}
              {@render displayItem({ item, index })}
            {/if}
          {/each}
          <a href="/?world={world_id}&metal={metal_id}&inputName={value.name}">
            <div
              class="relative flex h-full items-center gap-2 rounded-2xl border bg-sky-300 p-6 shadow-2xl"
            >
              <span class="text-4xl">🆕</span>
              <p class="text-2xl font-bold">Create a new one</p>
            </div>
          </a>
        </div>
      {/if}
    {/each}
  {/if}
</main>

<!-- Editing -->
{#if editing.editing}
  {@const item = editing.item}
  {#if item}
    <pre>
      <code>
        {JSON.stringify(item, null, 2)}
      </code>
    </pre>
    <div
      class="absolute top-0 left-0 z-40 flex h-screen w-screen items-center justify-center bg-gray-950/80 text-black"
    >
      <form
        {...updateItem}
        bind:this={modal}
        class="flex max-w-1/3 min-w-1/3 flex-col gap-4 rounded-2xl bg-white p-8"
      >
        <h1>Editing <span class="font-black">{item.name}</span></h1>
        <input type="text" bind:value={item.name} class="rounded" />
        <select bind:value={item.inputItemName} class="rounded">
          {#each inputItems as value}
            <option>{value.name}</option>
          {/each}
        </select>
        <label>
          <div class="grid grid-cols-8 gap-4">
            {#each editing.path as value, index}
              <div data-hello="bho" class="text-md relative w-12 rounded border font-semibold">
                <button
                  class="absolute -top-2 -right-2 z-40 cursor-pointer rounded-full bg-gray-900 p-1.5 text-center text-[0.5rem] hover:visible"
                  onclick={() => {
                    editing.path.splice(index, 1);
                  }}
                >
                  ❌
                </button>
                <input
                  class="max-w-full"
                  type="number"
                  bind:value={
                    () => value,
                    (newValue) => {
                      editing.path[index] = newValue;
                    }
                  }
                />
              </div>
            {/each}
            <button
              class="cursor-pointer rounded border p-2 font-black"
              onclick={() => editing.path.push(0)}>+</button
            >
          </div>
        </label>
        <div>
          <label for="">
            Last
            <select
              bind:value={
                () => editing.item?.lastAction,
                (v) => {
                  editing.item!.lastAction = v === undefined ? null : v;
                  if (v) {
                    editing.path[editing.path.length - 1] = v;
                  }
                }
              }
            >
              {#each [-15, -9, -6, -3, 2, 7, 13, 16] as value}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
          <label for="">
            Second Last
            <select
              bind:value={
                () => editing.item?.secondAction,
                (v) => {
                  editing.item!.secondAction = v === undefined ? null : v;
                  if (v) {
                    editing.path[editing.path.length - 2] = v;
                  }
                }
              }
            >
              {#each [-15, -9, -6, -3, 2, 7, 13, 16] as value}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
          <label for="">
            Third Last
            <select
              bind:value={
                () => editing.item?.thirdAction,
                (v) => {
                  editing.item!.thirdAction = v === undefined ? null : v;
                  if (v) {
                    editing.path[editing.path.length - 3] = v;
                  }
                }
              }
            >
              {#each [-15, -9, -6, -3, 2, 7, 13, 16] as value}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
        </div>
        <button
          onclick={() => {
            updateItem({
              name: item.name,
              inputItem: item.inputItemName,
              path: editing.path,
              id: item.id,
              actions: [item.lastAction, item.secondAction, item.thirdAction],
              worldId: world_id,
              metalId: metal_id,
            });
            editing.editing = false;
          }}
          class="cursor-pointer rounded bg-green-600 py-2 font-black text-white uppercase"
        >
          Update
        </button>
      </form>
    </div>
  {/if}
{/if}

<style>
  input[type="number"] {
    appearance: none;
    -moz-appearance: textfield;
  }
</style>
