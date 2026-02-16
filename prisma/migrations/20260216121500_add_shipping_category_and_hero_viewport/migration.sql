-- Add viewport targeting for hero images
ALTER TABLE "HeroImage"
ADD COLUMN IF NOT EXISTS "viewport" TEXT NOT NULL DEFAULT 'desktop';

-- Add category targeting for shipping rules
ALTER TABLE "ShippingRule"
ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'jewelry';

-- Improve query performance for storefront lookups
CREATE INDEX IF NOT EXISTS "HeroImage_viewport_sortOrder_idx"
ON "HeroImage"("viewport", "sortOrder");

CREATE INDEX IF NOT EXISTS "ShippingRule_category_minAmount_idx"
ON "ShippingRule"("category", "minAmount");
