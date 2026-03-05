-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "paymentIntentId" TEXT,
ADD COLUMN "shippingAddress" JSONB,
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "trackingNumber" TEXT;

-- Normalize existing status values before enum conversion.
UPDATE "Order"
SET "status" = CASE
    WHEN "status" IN ('PENDING', 'SHIPPED', 'DELIVERED') THEN "status"
    ELSE 'DELIVERED'
END;

-- Convert status column from TEXT to enum.
ALTER TABLE "Order"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::"OrderStatus"),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "Order"("paymentIntentId");
