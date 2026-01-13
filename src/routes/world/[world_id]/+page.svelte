<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { redirect } from "@sveltejs/kit";
  import { getMetals } from "../../data.remote";

  const metals = await getMetals();
  const worldName = page.params.world_id;
  if (worldName === undefined) redirect(308, "/world");
</script>

<main class="h-screen w-screen bg-black/80">
  <div class="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-6">
    {#each metals as metal (metal.id)}
      <a
        href={resolve("/world/[world_id]/metal/[metal_id]", {
          world_id: worldName,
          metal_id: metal.name,
        })}
      >
        <div
          class="h-24 w-48 place-content-center rounded-2xl bg-white text-center text-sm font-bold"
        >
          <p class="text-2xl">{metal.name}</p>
        </div>
      </a>
    {/each}
  </div>
</main>
