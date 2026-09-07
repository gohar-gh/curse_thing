import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations complete.");

  await migrationClient.end();
}

main().catch((err) => {
  // Log the message only, not the full error object — some postgres
  // driver failure modes (e.g. connection errors) embed the raw
  // connection string, including its password, in error properties
  // beyond .message.
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
