ALTER TABLE "expenses" ADD COLUMN "installment_group_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "total_installments" integer;--> statement-breakpoint
CREATE INDEX "expenses_installment_group_idx" ON "expenses" USING btree ("installment_group_id");