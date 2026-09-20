import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Ensures the news_articles table exists.
 * Idempotent: safe to run on every startup.
 */
async function migrateNewsArticles() {
  console.log('Running migration: ensuring news_articles table exists');

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "news_articles" (
        "id" serial PRIMARY KEY NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "excerpt" text,
        "content" text NOT NULL,
        "type" text DEFAULT 'news' NOT NULL,
        "tags" text[],
        "views" integer DEFAULT 0,
        "published_at" timestamp DEFAULT now(),
        "date_created" timestamp DEFAULT now(),
        "date_updated" timestamp DEFAULT now(),
        CONSTRAINT "news_articles_slug_unique" UNIQUE("slug")
      )
    `);

    console.log('Migration completed successfully: news_articles table ready');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration directly
migrateNewsArticles()
  .catch((error) => {
    console.error('Migration script failed:', error);
  });

export { migrateNewsArticles };
