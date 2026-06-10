CREATE TYPE "public"."loyalty_kind" AS ENUM('earn', 'redeem', 'adjust');--> statement-breakpoint
CREATE TABLE "loyalty_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" "loyalty_kind" NOT NULL,
	"amount_cents" integer NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "credit_applied_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loyalty_credits" ADD CONSTRAINT "loyalty_credits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_credits" ADD CONSTRAINT "loyalty_credits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loyalty_credits_customer_idx" ON "loyalty_credits" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "loyalty_credits_expires_idx" ON "loyalty_credits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "loyalty_credits_order_idx" ON "loyalty_credits" USING btree ("order_id");