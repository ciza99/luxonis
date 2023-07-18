import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { NewImage, NewProperty, Property, images, properties } from "models";
import puppeteer, { Page } from "puppeteer";
import dotenv from "dotenv";

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
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const db = drizzle(client);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(PAGE_URL);

  const scrapedProperties: PropertyScrape[] = [];
  while (scrapedProperties.length < PROPERTY_LIMIT) {
    console.log("page loading");
    await page.waitForSelector("div.property");
    console.log("page loaded");

    const propertiesFromPage = await getPropertiesOnPage(page);
    console.log(propertiesFromPage);
    scrapedProperties.push(...propertiesFromPage);

    const nextPageButton = await page.$("a.paging-next");
    const hrefHandle = await nextPageButton?.getProperty("href");
    const href = await hrefHandle?.jsonValue();
    console.log({ nextPageButton, href });

    if (!href) break;
    page.goto(href.toString());
    console.log("next page");
  }

  console.log("finished scraping");

  await migrate(db, { migrationsFolder: "./drizzle" });

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

scrape()
  .then(() => {
    console.log("scrape successful");
  })
  .catch(console.error);
