import { db, adminsTable } from "@workspace/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function main() {
  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";

  const existing = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (existing.length > 0) {
    console.log(`Admin "${username}" already exists. Updating password...`);
    const hash = await bcrypt.hash(password, 10);
    await db.update(adminsTable).set({ passwordHash: hash }).where(eq(adminsTable.username, username));
    console.log("Password updated.");
  } else {
    const hash = await bcrypt.hash(password, 10);
    await db.insert(adminsTable).values({ username, passwordHash: hash });
    console.log(`Admin "${username}" created with password "${password}"`);
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
