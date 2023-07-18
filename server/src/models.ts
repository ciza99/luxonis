import { InferModel } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title"),
  price: text("price"),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
});

export type Property = InferModel<typeof properties>;
export type NewProperty = InferModel<typeof properties, "insert">;

export type Image = InferModel<typeof images>;
export type NewImage = InferModel<typeof images, "insert">;
