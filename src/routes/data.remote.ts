import { command, form, query } from "$app/server";
import { db } from "$lib/server/db";
import { AlloyDB, inputItemDB, itemDB, metalGroupsDB, worldDB } from "$lib/server/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import z from "zod";

// TODO: Change from zod to valibot

export const getWorlds = query(async () => {
  const worlds = await db.select().from(worldDB).orderBy(asc(worldDB.name));
  return worlds;
});

export const getMetals = query(async () => {
  const metalsGroup = await db.select().from(metalGroupsDB).orderBy(asc(metalGroupsDB.name));
  return metalsGroup;
});

export const allItems = query(async () => {
  const items = await db.select().from(itemDB);
  return items;
});

export const getItems = query(
  z.object({
    worldId: z.string(),
    metalId: z.string(),
  }),
  async ({ worldId, metalId }) => {
    const items = await db
      .select()
      .from(itemDB)
      .where(and(eq(itemDB.world_id, worldId), eq(itemDB.metal_id, metalId)))
      .orderBy(asc(itemDB.name));
    return items;
  },
);

export const createWorld = form(z.object({ name: z.string().min(1) }), async ({ name }) => {
  await db.insert(worldDB).values({ name: name });
  getWorlds().refresh();
});

export const createMetal = form(z.object({ name: z.string().min(1) }), async ({ name }) => {
  await db.insert(metalGroupsDB).values({ name: name });
  getMetals().refresh();
});

const action = z
  .union([
    z.number("-15"),
    z.number("-9"),
    z.number("-6"),
    z.number("-3"),
    z.number("2"),
    z.number("7"),
    z.number("13"),
    z.number("16"),
  ])
  .nullable();
export const createItem = command(
  z.object({
    name: z.string().min(1),
    metalID: z.string(),
    worldID: z.string(),
    itemInput: z.string(),
    path: z.array(z.number()),
    actions: z.tuple([action, action, action]),
  }),
  async ({ name, worldID, metalID, itemInput, path, actions }) => {
    const [last, second, third] = actions;
    await db.insert(itemDB).values({
      name: name,
      world_id: worldID,
      metal_id: metalID,
      inputItemName: itemInput,
      path: path,
      lastAction: last !== 0 ? last : null,
      secondAction: second !== 0 ? second : null,
      thirdAction: third !== 0 ? third : null,
    });
  },
);

export const removeItem = command(z.string(), async (itemID) => {
  await db.delete(itemDB).where(eq(itemDB.id, itemID));
});

export const getInputItems = query(async () => {
  const inputItems = await db.select().from(inputItemDB);
  return inputItems;
});

export const bho = form(
  z.object({
    itemId: z.string(),
    itemName: z.string(),
    path: z.array(z.number()),
    inputItem: z.string(),
    worldId: z.string(),
    metalId: z.string(),
    lastAction: z.union([
      z.number("-15"),
      z.number("-9"),
      z.number("-6"),
      z.number("-3"),
      z.number("2"),
      z.number("7"),
      z.number("13"),
      z.number("16"),
      z.number("0")
    ]),
    secondAction: z.union([
      z.number("-15"),
      z.number("-9"),
      z.number("-6"),
      z.number("-3"),
      z.number("2"),
      z.number("7"),
      z.number("13"),
      z.number("16"),
      z.number("0")
    ]),
    thirdAction: z.union([
      z.number("-15"),
      z.number("-9"),
      z.number("-6"),
      z.number("-3"),
      z.number("2"),
      z.number("7"),
      z.number("13"),
      z.number("16"),
      z.number("0")
    ]),
  }),
  async ({
    itemId,
    itemName,
    path,
    inputItem,
    worldId,
    metalId,
    lastAction,
    secondAction,
    thirdAction
  }) => {
    await db.update(itemDB).set({
      name: itemName,
      path: path,
      inputItemName: inputItem,
      lastAction: lastAction === 0 ? null : lastAction,
      secondAction: secondAction === 0 ? null : secondAction,
      thirdAction: thirdAction === 0 ? null : thirdAction
    }).where(eq(itemDB.id, itemId));

    await getItems({ worldId, metalId }).refresh();
  },
);

export const updateItem = command(
  z.object({
    id: z.string(),
    name: z.string(),
    path: z.array(z.number()),
    inputItem: z.string(),
    actions: z.tuple([action, action, action]),
    worldId: z.string(),
    metalId: z.string(),
  }),
  async ({ id, name, path, inputItem, actions, worldId, metalId }) => {
    const [last, secondLast, thirdLast] = actions;
    await db
      .update(itemDB)
      .set({
        name: name,
        path: path,
        inputItemName: inputItem,
        lastAction: last,
        secondAction: secondLast,
        thirdAction: thirdLast,
      })
      .where(eq(itemDB.id, id));

    getItems({ metalId, worldId }).refresh();
  },
);

export const getAlloys = query(async () => {
  return await db.select().from(AlloyDB);
});

const alloyIngZod = z.object({
  fluidName: z.string().min(1),
  min: z.number().min(1).max(99),
  max: z.number().min(1).max(99),
});

export const createAlloyDB = command(
  z.object({
    name: z.string(),
    ingredients: z.array(alloyIngZod).min(2),
  }),
  async ({ name, ingredients }) => {
    await db.insert(AlloyDB).values({
      name: name,
      ingredients: ingredients,
    });
  },
);
