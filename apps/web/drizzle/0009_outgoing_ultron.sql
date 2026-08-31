CREATE TABLE "card_machines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"anticipated_fee_percent" real DEFAULT 0 NOT NULL,
	"non_anticipated_fee_percent" real DEFAULT 0 NOT NULL,
	"anticipation_days" integer DEFAULT 1 NOT NULL,
	"installment_interval_days" integer DEFAULT 30 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_receivables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"net_cents" integer NOT NULL,
	"expected_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_receivables_payment_installment_unique" UNIQUE("payment_id","installment_number")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "machine_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "anticipated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_receivables" ADD CONSTRAINT "payment_receivables_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_receivables_expected_at_idx" ON "payment_receivables" USING btree ("expected_at");--> statement-breakpoint
CREATE INDEX "payment_receivables_settled_at_idx" ON "payment_receivables" USING btree ("settled_at");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_machine_id_card_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."card_machines"("id") ON DELETE no action ON UPDATE no action;