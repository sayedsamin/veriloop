CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"referrer_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ratings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_status_check" CHECK ("referrals"."status" in ('pending', 'submitted', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;