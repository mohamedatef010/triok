import { loadEnvFile } from "node:process";
try { loadEnvFile(); } catch {}
try { loadEnvFile("../../.env"); } catch {}

import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const isProduction = process.env.NODE_ENV === "production";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@videomontazh.ru";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? "" : "admin123");
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

if (isProduction && (!ADMIN_PASSWORD || ADMIN_PASSWORD === "admin123")) {
  throw new Error("SECURITY ERROR: Please provide a strong ADMIN_PASSWORD in environment variables for production seeding.");
}

const USER_EMAIL = process.env.TEST_USER_EMAIL || "user@example.com";
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || (isProduction ? "" : "user123");
const USER_NAME = process.env.TEST_USER_NAME || "Test User";


async function upsertUser(
  email: string,
  password: string,
  name: string,
  role: "user" | "admin",
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    await db
      .update(usersTable)
      .set({ passwordHash, name, role })
      .where(eq(usersTable.id, existing.id));
    console.log(`Updated ${role}: ${email}`);
    return;
  }

  await db.insert(usersTable).values({ email, passwordHash, name, role });
  console.log(`Created ${role}: ${email}`);
}

async function main() {
  await upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, "admin");
  await upsertUser(USER_EMAIL, USER_PASSWORD, USER_NAME, "user");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
