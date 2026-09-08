-- Add Cashfree as an online payment method (temporary replacement for Razorpay).
-- Postgres allows adding an enum value; we don't use it in the same transaction.
ALTER TYPE "PaymentMethod" ADD VALUE 'CASHFREE';

-- Cashfree gateway identifiers on orders (order_id = our order.id, payment_id
-- comes from the payment-status verification).
ALTER TABLE "order" ADD COLUMN "cashfreeOrderId" TEXT;
ALTER TABLE "order" ADD COLUMN "cashfreePaymentId" TEXT;