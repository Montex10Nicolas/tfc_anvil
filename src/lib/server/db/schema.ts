import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const worldDB = sqliteTable('world', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
})

export const metalGroupsDB = sqliteTable('metalgroups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
})

export const itemDB = sqliteTable('item', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  metal_id: text('metal_id').references(() => metalGroupsDB.id).notNull(),
  world_id: text('world_id').references(() => worldDB.id).notNull(),
  path: text('path', { mode: "json" }).notNull().$type<number[]>().default(sql`(json_array())`).notNull(),
  inputItemName: text('inputItemName').references(() => inputItemDB.name).default("ingot").notNull(),
  lastAction: integer('last'),
  secondAction: integer('second'),
  thirdAction: integer('third')
});

export const inputItemDB = sqliteTable("inputItem", {
  name: text('name').primaryKey().notNull(),
  inIngots: integer('inIngots').notNull(),
  inMillibuckets: integer('inMillibuckets').notNull()
});

export type alloyIngredient = {
  fluidName: string,
  min: number,
  max: number
}

export const AlloyDB = sqliteTable("alloys", {
  name: text('name').primaryKey().notNull(),
  ingredients: text("ingredients", { mode: "json" }).$type<alloyIngredient[]>().notNull().default(sql`(json_array())`)
});

export type ItemDBSelect = typeof itemDB.$inferSelect;
export type AlloyDBSelect = typeof AlloyDB.$inferInsert;

export type ActionType = -15 | -9 | -6 | -3 | 2 | 7 | 13 | 15 | null;
export type ActionsType = [ActionType, ActionType, ActionType];
