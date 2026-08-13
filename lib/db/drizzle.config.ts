import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve("../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/users.ts",
    "./src/schema/categories.ts",
    "./src/schema/videos.ts",
    "./src/schema/reviews.ts",
    "./src/schema/orders.ts",
    "./src/schema/favorites.ts",
    "./src/schema/cart.ts",
    "./src/schema/analytics.ts",
    "./src/schema/videoAccess.ts",
    "./src/schema/site-settings.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
