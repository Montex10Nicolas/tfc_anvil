<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { getMetals } from "../../data.remote";

  const metals = await getMetals();
  const worldName = page.params.world_id;
</script>

<main class="h-screen w-screen bg-black/80">
  <div class="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-6">
    {#each metals as metal (metal.id)}
      <a href={resolve(`/world/${worldName}/metal/${metal.name}`)}>
        <div
          class="h-24 w-48 place-content-center rounded-2xl bg-white text-center text-sm font-bold"
        >
          <p class="text-2xl">{metal.name}</p>
        </div>
      </a>
    {/each}
  </div>
</main>
