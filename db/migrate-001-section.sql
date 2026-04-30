-- Migration: add section column for current / archive split
-- Run once on your existing database with:
--   wrangler d1 execute roulaharb-products --remote --file=db/migrate-001-section.sql

ALTER TABLE products ADD COLUMN section TEXT NOT NULL DEFAULT 'current';
