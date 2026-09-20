import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle database instance
export const db = drizzle(pool);

// Shared pool, also used for the Postgres session store
export { pool };