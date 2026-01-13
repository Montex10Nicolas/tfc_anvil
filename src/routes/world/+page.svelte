<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { getWorlds, removeWorld } from "../data.remote";

  const worlds = $derived(await getWorlds());
  let displayRemoveButton = $state(-1);

  let confirmDelete = $state(-1);

  onMount(() => {
    if (worlds.length === 0) {
      goto(resolve(`/world/${worlds[0].name}`));
    }
  });
</script>

{#if confirmDelete !== -1}
  {@const world = worlds[confirmDelete]}
  <section class="absolute z-100 flex h-screen w-screen items-center justify-center bg-sky-700/80">
    <form
      {...removeWorld.enhance(async ({ submit }) => {
        await submit();
        confirmDelete = -1;
      })}
      class="rounded-2xl bg-white p-8"
    >
      <p>Are you sure you want to delete <span class="text-2xl font-bold">{world.name}</span>?</p>
      <input
        type="text"
        {...removeWorld.fields.worldId.as("text")}
        value={world.id}
        class="hidden"
      />
      <div class="flex gap-4">
        <button
          type="button"
          class="cursor-pointer rounded-sm bg-red-600 p-2 font-semibold text-white uppercase"
          onclick={() => {
            confirmDelete = -1;
          }}>No</button
        >
        <button
          class="cursor-pointer rounded-sm bg-amber-600 p-2 font-semibold text-white uppercase"
          type="submit"
        >
          Yes</button
        >
      </div>
    </form>
  </section>
{/if}

<main class="flex h-screen w-screen items-center justify-center bg-black/80">
  <div class="grid gap-4 grid-cols-{worlds.length > 2 ? 2 : worlds.length}">
    {#each worlds as { name, id }, index (id)}
      <div class="relative">
        {#if displayRemoveButton === index}
          <div class="absolute top-2 right-3 z-90 text-xl">
            <button
              onclick={() => {
                confirmDelete = index;
              }}
              class="cursor-pointer"
            >
              ❌
            </button>
          </div>
        {/if}
        <a href={resolve(`/world/${name}`)}>
          <div
            role="button"
            tabindex="0"
            onblur={null}
            onfocus={null}
            onmouseover={() => {
              displayRemoveButton = index;
            }}
            onmouseleave={() => {
              displayRemoveButton = -1;
            }}
            class="relative grid place-items-center rounded-2xl bg-white px-12 py-32"
          >
            <p class="text-4xl font-black">{name}</p>
          </div>
        </a>
      </div>
    {/each}
  </div>
</main>
