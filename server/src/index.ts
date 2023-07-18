import { db } from "db";
import dotenv from "dotenv";
import { asc, eq, inArray } from "drizzle-orm";
import express from "express";
import { Image, Property, images, properties } from "models";

dotenv.config();

const app = express();

app.get("/properties", async (req, res) => {
  const page = Number(req.query.page ?? "1");

  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: "Invalid page" });
  }

  console.log({ page });

  const offset = (page - 1) * 20;

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
          .limit(20)
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

  console.log({ result });

  res.json(result);
});

const port = process.env.PORT ?? 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
