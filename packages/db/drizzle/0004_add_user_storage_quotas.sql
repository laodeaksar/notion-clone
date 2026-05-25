CREATE TABLE "user_storage_quotas" (
        "user_id" varchar(36) PRIMARY KEY NOT NULL,
        "used_bytes" bigint DEFAULT 0 NOT NULL,
        "limit_bytes" bigint NOT NULL,
        "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_storage_quotas" ADD CONSTRAINT "user_storage_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
