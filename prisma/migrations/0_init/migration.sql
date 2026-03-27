-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FittingStatus" AS ENUM ('DRAFT', 'ORDERED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile_name" TEXT,
    "jacketSize" TEXT,
    "trouserSize" TEXT,
    "fitPreference" TEXT,
    "appointmentDate" TEXT,
    "appointmentTime" TEXT,
    "technicalSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,

    CONSTRAINT "FitProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitting_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "productionLine" TEXT NOT NULL,
    "jacketBaseBlock" TEXT,
    "trouserBaseBlock" TEXT,
    "masterFitType" TEXT,
    "measurements" JSONB NOT NULL,
    "tailorName" TEXT,
    "customerEmail" TEXT NOT NULL,
    "status" "FittingStatus" NOT NULL DEFAULT 'DRAFT',
    "fitProfileId" TEXT,

    CONSTRAINT "fitting_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitMeasurement" (
    "id" TEXT NOT NULL,
    "fitProfileId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignSession" (
    "id" TEXT NOT NULL,
    "user_email" TEXT,
    "productId" TEXT NOT NULL,
    "selections" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "location" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "fitProfileId" TEXT,
    "notes" TEXT,
    "suggestedJacket" TEXT,
    "suggestedTrouser" TEXT,
    "tailorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionSpec" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fitProfileId" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shopifyId_key" ON "Customer"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FitProfile_email_key" ON "FitProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fitting_sessions_shopifyOrderId_key" ON "fitting_sessions"("shopifyOrderId");

-- AddForeignKey
ALTER TABLE "FitProfile" ADD CONSTRAINT "FitProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitting_sessions" ADD CONSTRAINT "fitting_sessions_fitProfileId_fkey" FOREIGN KEY ("fitProfileId") REFERENCES "FitProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitMeasurement" ADD CONSTRAINT "FitMeasurement_fitProfileId_fkey" FOREIGN KEY ("fitProfileId") REFERENCES "FitProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fitProfileId_fkey" FOREIGN KEY ("fitProfileId") REFERENCES "FitProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionSpec" ADD CONSTRAINT "ProductionSpec_fitProfileId_fkey" FOREIGN KEY ("fitProfileId") REFERENCES "FitProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
