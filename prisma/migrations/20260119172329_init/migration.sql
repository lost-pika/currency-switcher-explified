-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_settings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "selectedCurrencies" TEXT[] DEFAULT ARRAY['USD', 'EUR']::TEXT[],
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "placement" TEXT NOT NULL DEFAULT 'fixed',
    "inlineSide" TEXT DEFAULT 'right',
    "fixedCorner" TEXT,
    "distanceTop" INTEGER,
    "distanceRight" INTEGER,
    "distanceBottom" INTEGER,
    "distanceLeft" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_settings_shop_key" ON "merchant_settings"("shop");

-- CreateIndex
CREATE INDEX "merchant_settings_shop_idx" ON "merchant_settings"("shop");
