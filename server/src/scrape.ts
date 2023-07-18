import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { NewImage, NewProperty, Property, images, properties } from "./models";
import puppeteer, { Page } from "puppeteer";
import dotenv from "dotenv";
import { db } from "./db";

dotenv.config();

const PAGE_URL = "https://www.sreality.cz/en/search/for-sale/apartments";
const PROPERTY_LIMIT = 500;

type PropertyScrape = Omit<Property, "id"> & { images: string[] };

const getPropertiesOnPage = async (page: Page): Promise<PropertyScrape[]> => {
  return await page.evaluate(() => {
    const properties: PropertyScrape[] = [];

    document.querySelectorAll("div.property").forEach((property) => {
      const images: string[] = [];
      property.querySelectorAll("img").forEach((img) => images.push(img.src));

      const title = property.querySelector("h2")?.textContent?.trim() ?? null;
      const price =
        property.querySelector("span.price")?.textContent?.trim() ?? null;

      properties.push({ title, images, price });
    });

    return properties;
  });
};

export const scrape = async () => {
  console.log("scraping started");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const migrationDb = drizzle(client);
  await migrate(migrationDb, { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("migration finished");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto(PAGE_URL);

  const scrapedProperties: PropertyScrape[] = [];
  while (scrapedProperties.length < PROPERTY_LIMIT) {
    console.log(`scraped properties: ${scrapedProperties.length}`);
    await page.waitForSelector("div.property");

    const propertiesFromPage = await getPropertiesOnPage(page);
    scrapedProperties.push(...propertiesFromPage);

    const nextPageButton = await page.$("a.paging-next");
    const hrefHandle = await nextPageButton?.getProperty("href");
    const href = await hrefHandle?.jsonValue();

    if (!href) break;
    page.goto(href.toString());
  }

  await db.delete(images);
  await db.delete(properties);

  await Promise.all(
    scrapedProperties.map(async (scrapedProperty) => {
      return db.transaction(async (tx) => {
        const property: NewProperty = {
          title: scrapedProperty.title,
          price: scrapedProperty.price,
        };
        const [{ insertedUserId }] = await tx
          .insert(properties)
          .values(property)
          .returning({ insertedUserId: properties.id });

        const newImages: NewImage[] = scrapedProperty.images.map((url) => ({
          url,
          propertyId: insertedUserId,
        }));
        await tx.insert(images).values(newImages);
      });
    })
  );

  await page.close();
  await browser.close();
  await client.end();
};

scrape().then(() => {
  console.log("scraping finished");
});
