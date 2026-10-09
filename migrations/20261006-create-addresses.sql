CREATE TABLE IF NOT EXISTS public.addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  label VARCHAR(20) NOT NULL DEFAULT 'home'
    CHECK (label IN ('home', 'work', 'other')),
  address_line TEXT NOT NULL,
  ward VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx
  ON public.addresses (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_per_user_idx
  ON public.addresses (user_id)
  WHERE is_default = TRUE;
