import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// DATABASE_URL is only required for commands that touch a live database
// (migrate, studio, push). `generate` diffs the schema files locally and
// doesn't need a real connection, so we fall back to a placeholder here.
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder/placeholder",
  },
});
