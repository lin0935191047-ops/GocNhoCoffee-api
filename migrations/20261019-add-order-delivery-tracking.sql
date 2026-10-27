ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipper_latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS shipper_longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS shipper_location_updated_at TIMESTAMP WITH TIME ZONE;
