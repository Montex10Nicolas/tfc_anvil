<script lang="ts">
  let steelAmount = $state(0);
  let steel = $derived({
    CastIron: steelAmount,
    flux: steelAmount,
  });

  let blackSteelAmount = $state(0);
  let blackSteel = $derived({
    pigIron: blackSteelAmount,
    steel: blackSteelAmount * 0.5,
    blackBronze: blackSteelAmount * 0.25,
    nickel: blackSteelAmount * 0.25,
  });

  let redSteelAmount = $state(0);
  let redSteel = $derived({
    blackSteel: redSteelAmount,
    alloy: {
      steel: redSteelAmount * 0.2,
      brass: redSteelAmount * 0.15,
      roseGold: redSteelAmount * 0.15,
      blackSteelAlloy: redSteelAmount * 0.5,
    },
  });
</script>

<main>
  <div>
    <h3>Steel</h3>
    <input type="number" bind:value={steelAmount} />
    <div>
      {#each Object.entries(steel) as [key, value]}
        <p>{key}: {value}</p>
      {/each}
    </div>
  </div>
  <div>
    <h3>Black Steel</h3>
    <input type="number" bind:value={blackSteelAmount} />
    <div>
      {#each Object.entries(blackSteel) as [key, value]}
        <p>{key}: {value}</p>
      {/each}
    </div>
  </div>
  <div>
    <h3>Red Steel</h3>
    <input
      type="number"
      bind:value={
        () => redSteelAmount,
        (value) => {
          blackSteelAmount = value + value * 0.5;
          redSteelAmount = value;
        }
      }
    />
    <div>
      {#each Object.entries(redSteel) as [key, value]}
        {#if typeof value === "object"}
          <p>{key}:</p>
          <ul>
            {#each Object.entries(value) as [a, b]}
              <li>{a}:{b}</li>
            {/each}
          </ul>
        {:else}
          <p>{key}: {value}</p>
        {/if}
      {/each}
    </div>
  </div>
</main>
