import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import { schema } from "@/db/schema";

config({ path: ".env" }); // or .env.local

// Provide the schema to drizzle so the returned `db` object is properly typed
export const db = drizzle(process.env.DATABASE_URL!, { schema });
