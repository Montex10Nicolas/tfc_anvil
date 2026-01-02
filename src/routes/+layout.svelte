<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { resolve } from "$app/paths";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<section>
  <div class="flex min-h-8 justify-around bg-white py-2 text-3xl font-bold uppercase">
    <a href={resolve("/")}>home</a>
    <a href={resolve("/world")}>world</a>
    <a href={resolve("/ores")}>ore</a>
    <a href={resolve("/alloys")}>alloys</a>
    <a href={resolve("/crops")}>crops</a>
  </div>
  {@render children()}
</section>
