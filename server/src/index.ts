import { db } from "./db";
import { Image, Property, images, properties } from "./models";
import dotenv from "dotenv";
import { asc, eq, inArray, sql } from "drizzle-orm";
import express from "express";
import cors from "cors";

const PROPERTY_LIMIT = 20;

dotenv.config();

const app = express();
app.use(cors());

app.get("/properties", async (req, res) => {
  const page = Number(req.query.page ?? "1");

  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: "Invalid page" });
  }

  const offset = (page - 1) * PROPERTY_LIMIT;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(properties);
  const pageCount = Math.ceil(countRow.count / PROPERTY_LIMIT);
  const rows = await db
    .select({ property: properties, image: images })
    .from(properties)
    .leftJoin(images, eq(properties.id, images.propertyId))
    .where(
      inArray(
        properties.id,
        db
          .select({ id: properties.id })
          .from(properties)
          .orderBy(asc(properties.id))
          .offset(offset)
          .limit(PROPERTY_LIMIT)
      )
    );

  const propertyIdToRecord = rows.reduce<
    Record<string, Property & { order: number; images: Image[] }>
  >((acc, row, index) => {
    if (!acc[row.property.id]) {
      acc[row.property.id] = { ...row.property, images: [], order: index };
    }

    if (row.image) {
      acc[row.property.id].images.push(row.image);
    }

    return acc;
  }, {});

  const result = Object.values(propertyIdToRecord).sort(
    (a, b) => a.order - b.order
  );

  res.json({ properties: result, pageCount });
});

const port = process.env.PORT ?? 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
