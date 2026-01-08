<script lang="ts">
  import type { ItemDBSelect } from "$lib/server/db/schema.js";
  import { onClickOutside } from "runed";
  import {
    getInputItems,
    getItem,
    getItems,
    getMetals,
    removeItem,
    updateItem,
  } from "../../../../data.remote";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";

  let { data } = $props();
  let { world_id, metal_id } = $derived(data);

  const inputItems = await getInputItems();
  const metals = await getMetals();

  const test = async () => await getItems({ worldId: world_id, metalId: metal_id });

  function addInformationToItems(value: ItemDBSelect[]) {
    let newItems: Array<ItemDBSelect & { deleted: boolean }> = [];
    value.map((item) => {
      newItems.push({ ...item, deleted: false });
    });
    return newItems;
  }

  let items = $state(addInformationToItems(await test()));

  let metalName = $derived(metals.find((v) => v.name === metal_id)!.name);

  let modal = $state<HTMLElement>()!;

  let editing: {
    item?: ItemDBSelect;
    editing: boolean;
    path: number[];
  } = $state({
    editing: false,
    path: [],
  });

  // editing = { item: items[0], editing: true, path: items[0].path };

  let filter = $state("");
  let sortInput = $state("");
  let groupped = $state(true);

  onClickOutside(
    () => modal,
    () => {
      editing.editing = false;
    },
  );

  let askForConfirm = $state("");

  let pinnedID = new SvelteSet<string>();
  let globallyPinned: Array<(typeof items)[0]> = $state([]);
  let pinnedAmount = new SvelteMap<string, number>();

  let sorted = $derived.by(() => {
    const globallyPinnedID = new SvelteSet<string>();
    globallyPinned.map((v) => {
      globallyPinnedID.add(v.id);
    });

    let arr = items.filter((item) => {
      const { id, deleted } = item;
      if (globallyPinnedID.has(id) || pinnedID.has(id) || deleted) return;
      return item;
    });

    if (sortInput !== "") {
      const sortedBy = sortInput.toLowerCase();

      arr = arr.filter((item) => {
        if (item.inputItemName === sortedBy) {
          return item;
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
    const itemsByMetal = new SvelteMap<string, number>();

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

  onMount(async () => {
    if (!localStorage) return;
    const itemsInStorage = localStorage.getItem("pinned_global");
    if (itemsInStorage === null) return [];

    const globalItems: Array<(typeof items)[0]> = JSON.parse(itemsInStorage);
    const ids: string[] = [];
    for (const item of globalItems) {
      ids.push(item.id);
    }

    const globally = addInformationToItems(await getItem({ ids }));
    globallyPinned = globally;
  });
</script>

<svelte:window onkeydown={editing.editing ? null : onkeydown} />

{#snippet displayItem({
  item,
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
          ({pathTotal})
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
            onclick={() => {
              editing = {
                item: { ...item },
                editing: true,
                path: [...item.path],
              };
            }}>✏️</button
          >
          <span class="relative">
            {#if askForConfirm === itemID}
              <div
                class="absolute bottom-6 -left-22 z-90 flex min-w-48 flex-col gap-1 rounded border border-black bg-white p-2"
              >
                <p>Are you sure you want to delete?</p>
                <div class="flex justify-around">
                  <button
                    class="cursor-pointer rounded bg-red-300 p-2 font-semibold uppercase"
                    onclick={() => {
                      askForConfirm = "";
                    }}>no</button
                  >
                  <button
                    class="cursor-pointer rounded bg-green-300 p-2 font-semibold uppercase"
                    onclick={async () => {
                      await removeItem(itemID);
                      askForConfirm = "";
                      item.deleted = true;
                    }}>yes</button
                  >
                </div>
              </div>
            {/if}
            <button
              class="cursor-pointer"
              onclick={async () => {
                if (isPinned && !isGlobal) {
                  pinnedID.delete(itemID);
                } else if (!isGlobal) {
                  askForConfirm = itemID;
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
          </span>
        </div>
      </div>

      <div class="flex w-[80%] flex-wrap items-center gap-1 text-lg">
        {#each path as value, index (`path-${value}-${index}`)}
          <div>
            <p class="text-end text-[0.6rem]">{index + 1}</p>
            <p>{value}</p>
          </div>
        {/each}
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
                  if (value !== path[0]) return index;
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
<!--   <dev class="flex flex-col"> -->
<!--     <!-- <code> {JSON.stringify(pinned, null, 2)}</code> -->
<!--     <!-- <code> {JSON.stringify(globallyPinned, null, 2)}</code> -->
<!--     <!-- <code> {JSON.stringify(ingotsNeededInMl, null, 2)}</code> -->
<!--     <code>{JSON.stringify(editing, null, 2)}</code> -->
<!--   </dev> -->
<!-- </div> -->

<main
  class="min-h-screen min-w-screen bg-black/80 pt-1 pb-2 {editing.editing
    ? 'max-h-screen overflow-hidden'
    : ''}"
>
  <div class="m-4 flex items-center justify-between">
    <a href={resolve(`/world/${world_id}`)}>
      <h1 class="cursor-pointer font-semibold text-violet-300">⬅️ Go back to metal selection</h1>
    </a>
    <h2 class="text-2xl font-bold text-white">{metalName}</h2>
  </div>
  <div class="m-4 flex items-center space-x-4 rounded bg-white px-4 py-2">
    <label class="flex flex-col items-center">
      <span> Filter by Input Item: </span>
      <select bind:value={sortInput} class="cursor-pointer rounded font-semibold capitalize">
        <option value=""> none</option>
        {#each inputItems as item (`filter-${item.name}`)}
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
          {#each ingotsNeededInMl as [metalNamee, amount] (`ingotsneeded-${metalNamee}-${amount}`)}
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
        {#each pinned as item, index (`pinned-${item.id}-${index}`)}
          {@render displayItem({ item, index, isPinned: true })}
        {/each}
        {#each globallyPinned as item, index (`globally-pinned-${item.id}-${index}`)}
          {@render displayItem({ item, index, isPinned: true, isGlobal: true })}
        {/each}
      </div>
    </div>
    <hr class="mx-4 my-4 mt-4 min-h-4 bg-amber-400" />
  {/if}
  <!-- end pinned -->

  {#if !groupped}
    <div class="mx-4 mt-4 grid grid-cols-3 gap-8 pb-8">
      {#each sorted as item, index (`groupped-${item.id}-${index}`)}
        {@render displayItem({ item, index })}
      {/each}
      <a href="/?world={world_id}&metal={metal_id}">
        <div class="relative flex h-full items-center gap-2 rounded-2xl bg-sky-300 p-6">
          <span class="text-4xl">🆕</span>
          <p class="text-2xl font-bold">Create a new one</p>
        </div>
      </a>
    </div>
  {:else}
    {#each inputItems as value (`groupped-${value.name}`)}
      {@const grouppedItems = sorted.filter((v) => {
        return v.inputItemName === value.name;
      })}
      {#if grouppedItems.length}
        <h1 class="mx-4 rounded bg-sky-600 px-4 py-2 text-4xl font-bold text-white capitalize">
          {value.name}
        </h1>
        <div class="m-4 grid grid-cols-3 gap-8">
          {#each grouppedItems as item, index (`groupped-${item.id}-${index}`)}
            {@render displayItem({ item, index })}
          {/each}
          <!-- eslint-disable-next-line -->
          <a href="/?world={world_id}&metal={metal_id}&inputName={value.name}">
            <div
              class="relative flex h-full items-center gap-2 rounded-2xl border bg-sky-300 p-6 shadow-2xl"
            >
              <span class="text-4xl">🆕</span>
              <p class="text-2xl font-bold">
                New <span class="capitalize">{value.name}</span> item
              </p>
            </div>
          </a>
        </div>
      {/if}
    {/each}
  {/if}
</main>

<!-- Editing -->
{#if editing.editing}
  {@const itemEditing = editing.item}
  {@const pathEditing = editing.path}
  {#if itemEditing}
    <div
      class="absolute top-0 left-0 z-40 flex h-screen w-screen items-center justify-center bg-gray-950/80 text-black"
    >
      <form
        bind:this={modal}
        class="flex max-w-1/3 min-w-1/3 flex-col gap-4 rounded-2xl bg-white p-8"
      >
        <h1>Editing <span class="font-black">{itemEditing.name}</span></h1>
        <input type="text" bind:value={itemEditing.name} class="rounded" />
        <select bind:value={itemEditing.inputItemName} class="rounded">
          {#each inputItems as value (`editing-${value.name}`)}
            <option>{value.name}</option>
          {/each}
        </select>
        <label>
          <div class="grid grid-cols-6 gap-4">
            {#each pathEditing as pathValue, index (`change-path-${itemEditing.id}-${index}`)}
              <div class="text-md relative flex w-16 gap-1 rounded border font-semibold">
                <button
                  class="cursor-pointer bg-gray-900 p-0.5 text-center text-[0.40rem] hover:visible"
                  onclick={() => {
                    // Something is wrong here to check
                    editing.path.splice(index, 1);
                  }}
                >
                  ❌
                </button>
                <input
                  class="max-w-full border-0 bg-transparent"
                  type="number"
                  bind:value={
                    () => pathValue,
                    (newValue) => {
                      editing.path[index] = newValue;
                    }
                  }
                />
              </div>
            {:else}
              <h1>wtf</h1>
            {/each}
            <button
              class="w-10 cursor-pointer rounded border p-2 font-black"
              onclick={() => editing.path.push(0)}>+</button
            >
          </div>
        </label>
        <div class="flex items-center justify-between">
          <label class="flex flex-col">
            <p class="text-sm">Last</p>
            <select
              class="rounded"
              bind:value={
                () => editing.item?.lastAction,
                (v) => {
                  v = v === undefined ? null : v;
                  if (!editing.item) return;
                  editing.item.lastAction = v;
                  if (v === null) {
                    editing.item.secondAction = null;
                    editing.item.thirdAction = null;
                  } else {
                    editing.path[editing.path.length - 1] = v;
                  }
                }
              }
            >
              {#each [null, -15, -9, -6, -3, 2, 7, 13, 16] as value (`editing-last-${value}`)}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
          <label class="flex flex-col">
            <p class="text-sm">Second Last</p>
            <select
              class="rounded"
              bind:value={
                () => editing.item?.secondAction,
                (v) => {
                  v = v === undefined ? null : v;
                  if (!editing.item) return;
                  editing.item.secondAction = v;
                  if (v === null) {
                    editing.item.thirdAction = null;
                  } else {
                    editing.path[editing.path.length - 2] = v;
                  }
                }
              }
            >
              {#each [null, -15, -9, -6, -3, 2, 7, 13, 16] as value (`editing-second-last-${value}`)}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
          <label class="flex flex-col">
            <p class="text-sm">Third Last</p>
            <select
              class="rounded"
              bind:value={
                () => editing.item?.thirdAction,
                (v) => {
                  v = v === undefined ? null : v;
                  if (!editing.item) return;
                  editing.item.thirdAction = v;
                  if (v !== null) {
                    editing.path[editing.path.length - 3] = v;
                  }
                }
              }
            >
              {#each [null, -15, -9, -6, -3, 2, 7, 13, 16] as value (`editing-third-last-${value}`)}
                <option value={value}>{value}</option>
              {/each}
            </select>
          </label>
        </div>
        <button
          onclick={() => {
            updateItem({
              id: itemEditing.id,
              name: itemEditing.name,
              path: editing.path,
              inputItem: itemEditing.inputItemName,
              actions: [itemEditing.lastAction, itemEditing.secondAction, itemEditing.thirdAction],
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
