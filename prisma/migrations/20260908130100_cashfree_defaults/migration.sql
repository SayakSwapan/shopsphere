-- Align PaymentTransaction defaults with the current (Cashfree) gateway.
ALTER TABLE "PaymentTransaction" ALTER COLUMN "gateway" SET DEFAULT 'CASHFREE';
ALTER TABLE "PaymentTransaction" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASHFREE';