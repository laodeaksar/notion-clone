CREATE TABLE "files" (
        "id" varchar(500) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "url" text NOT NULL,
        "size" integer NOT NULL,
        "content_type" varchar(127),
        "folder" varchar(255),
        "provider" varchar(50) DEFAULT 'r2' NOT NULL,
        "uploaded_by" varchar(36),
        "page_id" varchar(36),
        "created_at" timestamp NOT NULL,
        "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
