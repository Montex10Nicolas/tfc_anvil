import { command, form, query } from "$app/server";
import { db } from "$lib/server/db";
import { itemDB, metalGroupsDB, startingMaterial, worldDB } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";

export const getWorlds = query(async () => {
  const worlds = await db.select().from(worldDB);
  return worlds;
});

export const getMetals = query(async () => {
  const metalsGroup = await db.select().from(metalGroupsDB);
  return metalsGroup;
});

export const allItems = query(async () => {
  const items = await db.select().from(itemDB);
  return items;
});

export const createWorld = form((z.object({ name: z.string().min(1) })),
  async ({ name }) => {
    await db.insert(worldDB).values({ name: name });
    getWorlds().refresh();
  });

export const createMetal = form((z.object({ name: z.string().min(1) })),
  async ({ name }) => {
    await db.insert(metalGroupsDB).values({ name: name });
    getMetals().refresh();
  });

export const createItem = command((z.object({ name: z.string().min(1), metalID: z.string(), worldID: z.string(), materialID: z.string(), path: z.array(z.number()) })),
  async ({ name, worldID, metalID, materialID, path }) => {
    await db.insert(itemDB).values({ name: name, world_id: worldID, metal_id: metalID, startingMaterial: materialID, path: path });
  });

export const removeItem = command((z.string()), async (itemID) => {
  await db.delete(itemDB).where(eq(itemDB.id, itemID))
});

export const getMaterials = query(async () => {
  const materials = await db.select().from(startingMaterial);
  return materials;
})
