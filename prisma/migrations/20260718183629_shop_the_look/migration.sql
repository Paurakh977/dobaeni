-- CreateTable
CREATE TABLE "shopTheLook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "coverImage" TEXT NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "bundlePrice" DOUBLE PRECISION,
    "bundleDiscount" DOUBLE PRECISION,
    "isPublished" BOOLEAN DEFAULT false,
    "isFeatured" BOOLEAN DEFAULT false,
    "viewCount" INTEGER DEFAULT 0,
    "likeCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopTheLook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookHotspot" (
    "id" TEXT NOT NULL,
    "lookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "left" DOUBLE PRECISION NOT NULL,
    "top" DOUBLE PRECISION NOT NULL,
    "position" INTEGER DEFAULT 0,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookHotspot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopTheLook_slug_key" ON "shopTheLook"("slug");

-- CreateIndex
CREATE INDEX "shopTheLook_organizationId_idx" ON "shopTheLook"("organizationId");

-- CreateIndex
CREATE INDEX "shopTheLook_isPublished_idx" ON "shopTheLook"("isPublished");

-- CreateIndex
CREATE INDEX "lookHotspot_lookId_idx" ON "lookHotspot"("lookId");

-- CreateIndex
CREATE INDEX "lookHotspot_productId_idx" ON "lookHotspot"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "lookHotspot_lookId_productId_key" ON "lookHotspot"("lookId", "productId");

-- AddForeignKey
ALTER TABLE "shopTheLook" ADD CONSTRAINT "shopTheLook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookHotspot" ADD CONSTRAINT "lookHotspot_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "shopTheLook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookHotspot" ADD CONSTRAINT "lookHotspot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
