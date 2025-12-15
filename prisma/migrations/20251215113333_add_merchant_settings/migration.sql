/*
  Warnings:

  - You are about to drop the `MerchantSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MerchantSettings";

-- CreateTable
CREATE TABLE "merchant_settings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "selectedCurrencies" TEXT[] DEFAULT ARRAY['USD', 'EUR']::TEXT[],
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "placement" TEXT NOT NULL DEFAULT 'Fixed Position',
    "fixedCorner" TEXT NOT NULL DEFAULT 'bottom-right',
    "distanceTop" INTEGER NOT NULL DEFAULT 16,
    "distanceRight" INTEGER NOT NULL DEFAULT 16,
    "distanceBottom" INTEGER NOT NULL DEFAULT 16,
    "distanceLeft" INTEGER NOT NULL DEFAULT 16,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_settings_shop_key" ON "merchant_settings"("shop");

-- CreateIndex
CREATE INDEX "merchant_settings_shop_idx" ON "merchant_settings"("shop");
