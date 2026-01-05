<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getWorlds } from "../data.remote";

  const worlds = getWorlds();

  $effect(() => {
    if (!worlds.current) return;

    if (worlds.current.length === 1) {
      goto(resolve(`/world/${worlds.current[0].name}`));
    }
  });
</script>

<main class="flex h-screen w-screen items-center justify-center bg-black/80">
  {#if worlds.loading}
    <p>Worlds are loading...</p>
  {:else if worlds.error}
    <p>Error...</p>
  {:else if worlds.current}
    <div class="grid grid-cols-{worlds.current.length > 3 ? 3 : worlds.current.length}">
      {#each worlds.current as { name, id } (id)}
        <a href={resolve(`/world/${id}`)}>
          <div class="grid place-items-center rounded-2xl bg-white px-12 py-32">
            <p class="text-4xl font-black">{name}</p>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <p>How did I end up here</p>
  {/if}
</main>
