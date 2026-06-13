-- Migration: add collection_line column for collection grouping
-- Run once on your existing database with:
--   wrangler d1 execute roulaharb-products --remote --file=db/migrate-002-collection-line.sql

ALTER TABLE products ADD COLUMN collection_line TEXT;
