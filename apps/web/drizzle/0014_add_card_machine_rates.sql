CREATE TABLE "card_machine_rates" (
	"machine_id" uuid NOT NULL,
	"installments" integer NOT NULL,
	"fee_percent" real NOT NULL,
	CONSTRAINT "card_machine_rates_machine_id_installments_pk" PRIMARY KEY("machine_id","installments")
);
--> statement-breakpoint
ALTER TABLE "payment_receivables" ADD COLUMN "gross_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_receivables" ADD COLUMN "fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "card_machine_rates" ADD CONSTRAINT "card_machine_rates_machine_id_card_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."card_machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_machines" DROP COLUMN "installment_interval_days";