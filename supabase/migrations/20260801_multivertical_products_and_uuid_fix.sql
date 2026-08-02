-- Migration applied to production on 2026-08-01.
-- Documents the catalog evolution from real-estate-only to multivertical products
-- and the replacement of invalid min(uuid) aggregations with ordered selections.
-- The executable DDL was applied through the Supabase migration service.

comment on table public.products is
  'Commercial products across verticals such as real estate, vehicles, beauty, insurance, energy, consortia, tourism and services.';
