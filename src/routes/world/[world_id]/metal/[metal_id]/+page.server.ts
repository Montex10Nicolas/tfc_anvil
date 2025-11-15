import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { itemDB, metalGroupsDB, worldDB } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  const { world_id, metal_id } = params;

  const items = await db.select({ itemName: itemDB.name, path: itemDB.path, itemID: itemDB.id }).from(itemDB).where(and(eq(itemDB.world_id, world_id), eq(itemDB.metal_id, metal_id))).orderBy(itemDB.name);
  const worldName = (await db.select({ name: worldDB.name }).from(worldDB).where(eq(worldDB.id, world_id)))[0]
  const metalName = (await db.select({ name: metalGroupsDB.name }).from(metalGroupsDB).where(eq(metalGroupsDB.id, metal_id)))[0]

  return {
    items,
    worldName: worldName.name,
    metalName: metalName.name
  }
};
