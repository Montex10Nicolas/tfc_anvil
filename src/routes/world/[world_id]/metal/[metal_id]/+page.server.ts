import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const { metal_id, world_id } = params;

  return {
    metal_id,
    world_id,
  };
};
