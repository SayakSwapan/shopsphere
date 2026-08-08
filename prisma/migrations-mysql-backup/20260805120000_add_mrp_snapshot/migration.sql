-- Add the MRP (pre-sale) base price snapshot to order items so the invoice can
-- show the product offer discount that applied at checkout.
ALTER TABLE `orderitem` ADD COLUMN `mrpSnapshot` DECIMAL(10, 2) NULL;
