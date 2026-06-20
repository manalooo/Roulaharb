-- D1 schema for Roula Harb product catalog.
-- Run once with:  wrangler d1 execute roulaharb-products --remote --file=db/schema.sql

DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id            TEXT PRIMARY KEY,           -- e.g. "scarf-01", "wear-73", "bag-18"
  name          TEXT NOT NULL,
  category       TEXT NOT NULL,              -- 'scarves' | 'bags' | 'wearables' | 'pillows'
  subcollection  TEXT,                       -- 'KUMBAKONAM' | 'OSAKA' | 'Roma' | etc.
  collection_line TEXT,                      -- 'Canvas' | '24 Carats' | 'Luxurious' | 'Essential'
  era           TEXT,
  status        TEXT NOT NULL DEFAULT 'available',  -- 'available' | 'sold'
  price         TEXT,                       -- stored as text so 'ENTER PRICE HERE' or '320' both work
  material      TEXT,
  main_image    TEXT,                       -- relative path, e.g. 'jookh/bags/piece-18.png'
  hover_image   TEXT,                       -- optional, same format
  extra_views   TEXT,                       -- optional JSON array of extra image paths for gallery/lightbox (paintings, etc.)
  type          TEXT,                       -- garment type: 'Coat' | 'Blazer' | 'Kimono' | ...
  color         TEXT,                       -- dominant colour (merged palette)
  fit           TEXT,                       -- silhouette: 'Longline' | 'Tailored' | 'Boxy' | ...
  motif         TEXT,                       -- 'Portrait' | 'Floral' | 'Circle' | 'Abstract' | ...
  technique     TEXT,                       -- 'Gold leaf' | 'Tie-dye' | 'Hand-painted portrait' | ...
  sort_order    INTEGER                     -- preserves the row order from inventory.csv
);

-- Index for the most common query (filter by category, ordered by sort)
CREATE INDEX idx_products_category_order ON products(category, sort_order);
