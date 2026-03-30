-- A16: Fabric Catalogue Platform
-- Creates the fabrics table with all filter dimensions and suitability mapping

CREATE TABLE "fabrics" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "description"      TEXT,
    "mill"             TEXT NOT NULL,
    "season"           TEXT NOT NULL,
    "composition"      TEXT NOT NULL,
    "colourFamily"     TEXT NOT NULL,
    "pattern"          TEXT NOT NULL,
    "weightGm"         INTEGER,
    "articleCode"      TEXT,
    "costPricePence"   INTEGER,
    "upchargePence"    INTEGER NOT NULL DEFAULT 0,
    "swatchImageUrl"   TEXT,
    "drapeImageUrl"    TEXT,
    "suitableFor"      TEXT NOT NULL,
    "careInstructions" TEXT,
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "isLimitedEdition" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on article code
CREATE UNIQUE INDEX "fabrics_articleCode_key" ON "fabrics"("articleCode");

-- Filter indexes
CREATE INDEX "fabrics_colourFamily_idx" ON "fabrics"("colourFamily");
CREATE INDEX "fabrics_pattern_idx"      ON "fabrics"("pattern");
CREATE INDEX "fabrics_season_idx"       ON "fabrics"("season");
CREATE INDEX "fabrics_mill_idx"         ON "fabrics"("mill");
CREATE INDEX "fabrics_isActive_idx"     ON "fabrics"("isActive");
