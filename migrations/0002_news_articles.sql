CREATE TABLE "news_articles" (
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
);
--> statement-breakpoint
