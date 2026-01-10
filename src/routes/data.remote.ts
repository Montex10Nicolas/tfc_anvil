import { command, form, query } from "$app/server";
import { db } from "$lib/server/db";
import {
  AlloyDB,
  inputItemDB,
  itemDB,
  metalGroupsDB,
  worldDB,
  type ItemDBSelect,
} from "$lib/server/db/schema";
import { error, invalid } from "@sveltejs/kit";
import { and, asc, eq } from "drizzle-orm";
import * as v from "valibot";

// TODO: Change from v.d to valibot

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

// v.object({
//   worldId: v.string(),
//   metalId: v.string(),
// }),

export const getItems = query(
  v.object({
    worldId: v.string(),
    metalId: v.string(),
  }),
  async ({ worldId, metalId }) => {
    const worlds = await db.select().from(worldDB).where(eq(worldDB.name, worldId));
    if (worlds.length === 0 || worlds.length > 1) {
      return [];
    }
    const metals = await db.select().from(metalGroupsDB).where(eq(metalGroupsDB.name, metalId));
    if (metals.length === 0 || metals.length > 1) {
      return [];
    }
    const items = await db
      .select()
      .from(itemDB)
      .where(and(eq(itemDB.world_id, worlds[0].id), eq(itemDB.metal_id, metals[0].id)))
      .orderBy(asc(itemDB.name));
    return items;
  },
);

export const getItem = query(
  v.object({
    ids: v.array(v.string()),
  }),
  async ({ ids }) => {
    const items: ItemDBSelect[] = [];
    ids.map(async (id) => {
      const found = await db.query.itemDB.findFirst({
        where: eq(itemDB.id, id),
      });
      if (found) {
        items.push(found);
      }
    });
    return items;
  },
);

export const createWorld = form(
  v.object({ name: v.pipe(v.string(), v.minLength(1)) }),
  async ({ name }) => {
    await db.insert(worldDB).values({ name: name });
    getWorlds().refresh();
  },
);

export const createMetal = form(
  v.object({ name: v.pipe(v.string(), v.minLength(1)) }),
  async ({ name }) => {
    await db.insert(metalGroupsDB).values({ name: name });
    getMetals().refresh();
  },
);

const action = v.union([
  v.number("-15"),
  v.number("-9"),
  v.number("-6"),
  v.number("-3"),
  v.number("2"),
  v.number("7"),
  v.number("13"),
  v.number("16"),
]);
export const createItem = command(
  v.object({
    name: v.string(),
    metalID: v.string(),
    worldID: v.string(),
    itemInput: v.string(),
    path: v.array(v.number()),
    actions: v.tuple([action, action, action]),
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

export const removeItem = command(v.string(), async (itemID) => {
  const items = await db.delete(itemDB).where(eq(itemDB.id, itemID)).returning();
  const { world_id: worldId, metal_id: metalId } = items[0];
  await getItems({
    worldId,
    metalId,
  }).refresh();
});

export const getInputItems = query(async () => {
  const inputItems = await db.select().from(inputItemDB);
  return inputItems;
});

const a = v.nullable(v.number());

export const updateItem = command(
  v.object({
    id: v.string(),
    name: v.string(),
    path: v.array(v.number()),
    inputItem: v.string(),
    actions: v.tuple([a, a, a]),
  }),
  async ({ id, name, path, inputItem, actions }) => {
    const [last, secondLast, thirdLast] = actions;

    const returning = await db
      .update(itemDB)
      .set({
        name: name,
        path: path,
        inputItemName: inputItem,
        lastAction: last,
        secondAction: secondLast,
        thirdAction: thirdLast,
      })
      .where(eq(itemDB.id, id))
      .returning();

    const { world_id, metal_id } = returning[0];
    await getItems({
      worldId: world_id,
      metalId: metal_id,
    }).refresh();
  },
);

export const getAlloys = query(async () => {
  return await db.select().from(AlloyDB);
});

const alloyIngVB = v.object({
  fluidName: v.pipe(v.string(), v.minLength(1)),
  min: v.pipe(v.number(), v.toMinValue(1), v.toMaxValue(99)),
  max: v.pipe(v.number(), v.toMinValue(1), v.toMaxValue(99)),
});

export const createAlloyDB = form(
  v.object({
    name: v.string(),
    ingredients: v.pipe(v.array(alloyIngVB), v.minLength(2)),
  }),
  async ({ name, ingredients }, issue) => {
    console.table(ingredients);
    const isInvalid = ingredients.filter((ingredient) => {
      if (ingredient.max < ingredient.min) return ingredient;
    }).length;
    if (isInvalid) {
      invalid(issue.ingredients("Some Min is larger than some Max"));
    }
    await db.insert(AlloyDB).values({
      name: name,
      ingredients: ingredients,
    });
  },
);
