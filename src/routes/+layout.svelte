<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<section>
  <div class="flex min-h-8 justify-around bg-white py-2 text-3xl font-bold uppercase">
    <a href="/">home</a>
    <a href="/world">world</a>
    <a href="/ores">ore</a>
    <a href="/alloys">alloys</a>
    <a href="/crops">crops</a>
  </div>
  {@render children()}
</section>
