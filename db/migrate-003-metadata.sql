-- Adds catalogue-metadata columns that power the Collection-page facet filters.
-- Run once on an existing DB:
--   wrangler d1 execute roulaharb-products --remote --file=db/migrate-003-metadata.sql
ALTER TABLE products ADD COLUMN type TEXT;
ALTER TABLE products ADD COLUMN color TEXT;
ALTER TABLE products ADD COLUMN fit TEXT;
ALTER TABLE products ADD COLUMN motif TEXT;
ALTER TABLE products ADD COLUMN technique TEXT;
