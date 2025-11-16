import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { itemDB, metalGroupsDB, worldDB } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  const { world_id, metal_id } = params;

  const items = await db.select().from(itemDB).where(and(eq(itemDB.world_id, world_id), eq(itemDB.metal_id, metal_id))).orderBy(itemDB.name);
  const world = (await db.select({ name: worldDB.name, world_id: worldDB.id }).from(worldDB).where(eq(worldDB.id, world_id)))[0]
  const metal = (await db.select({ name: metalGroupsDB.name, metal_id: metalGroupsDB.id }).from(metalGroupsDB).where(eq(metalGroupsDB.id, metal_id)))[0]

  return {
    items,
    world,
    metal
  }
};
