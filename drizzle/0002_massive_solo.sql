CREATE TABLE "payment_fee_configs" (
	"method" "payment_method" PRIMARY KEY NOT NULL,
	"fee_percent" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
