-- VIBR Cloudflare Stream media assets.
-- Apply after 202611240002_project_video_series.sql.
-- Upload records are created/updated only by server-side Vercel functions using Supabase service role.

CREATE TABLE IF NOT EXISTS public.video_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stream_uid TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  duration_seconds NUMERIC(10,2) NOT NULL CHECK (duration_seconds > 0),
  status TEXT NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
  iframe_url TEXT NOT NULL,
  hls_url TEXT,
  dash_url TEXT,
  thumbnail_url TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at TIMESTAMPTZ
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_asset_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_video_asset_id_fkey'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_video_asset_id_fkey
      FOREIGN KEY (video_asset_id)
      REFERENCES public.video_assets(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_assets_author_created
  ON public.video_assets(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_assets_status_created
  ON public.video_assets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_assets_author_status_created
  ON public.video_assets(author_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_video_asset_id
  ON public.posts(video_asset_id)
  WHERE video_asset_id IS NOT NULL;

ALTER TABLE public.video_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and public ready videos can read video assets" ON public.video_assets;
DROP POLICY IF EXISTS "Owners and attached posts can read video status" ON public.video_assets;
CREATE POLICY "Owners and attached posts can read video status"
  ON public.video_assets
  FOR SELECT
  TO public
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.video_asset_id = video_assets.id
    )
  );

-- No client INSERT, UPDATE, or DELETE policies are intentionally created.
-- All writes are performed by authenticated server endpoints using the service role.

CREATE OR REPLACE FUNCTION public.validate_post_video_asset_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  asset_author UUID;
BEGIN
  IF NEW.video_asset_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT author_id
    INTO asset_author
    FROM public.video_assets
    WHERE id = NEW.video_asset_id;

  IF asset_author IS NULL OR asset_author <> NEW.author_id THEN
    RAISE EXCEPTION 'You can only attach your own VIBR video asset to a post.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_validate_video_asset_owner ON public.posts;
CREATE TRIGGER trg_posts_validate_video_asset_owner
  BEFORE INSERT OR UPDATE OF video_asset_id, author_id
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_post_video_asset_owner();

COMMENT ON TABLE public.video_assets IS
  'VIBR video metadata and Cloudflare Stream processing state; video bytes are stored and delivered by Cloudflare Stream.';


-- Atomically enforce an active-upload ceiling per builder. Advisory transaction
-- locks prevent two simultaneous requests from passing a non-atomic COUNT check.
CREATE OR REPLACE FUNCTION public.reserve_video_asset(
  p_author_id UUID,
  p_stream_uid TEXT,
  p_original_filename TEXT,
  p_mime_type TEXT,
  p_file_size_bytes BIGINT,
  p_duration_seconds NUMERIC,
  p_iframe_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INTEGER;
  new_asset_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_author_id::TEXT, 0));

  SELECT COUNT(*) INTO active_count
  FROM public.video_assets
  WHERE author_id = p_author_id
    AND status IN ('uploading', 'processing')
    AND created_at >= NOW() - INTERVAL '12 hours';

  IF active_count >= 3 THEN
    RAISE EXCEPTION 'upload_limit_exceeded';
  END IF;

  INSERT INTO public.video_assets (
    author_id, stream_uid, original_filename, mime_type,
    file_size_bytes, duration_seconds, status, iframe_url
  ) VALUES (
    p_author_id, p_stream_uid, p_original_filename, p_mime_type,
    p_file_size_bytes, p_duration_seconds, 'uploading', p_iframe_url
  )
  RETURNING id INTO new_asset_id;

  RETURN new_asset_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_video_asset(UUID, TEXT, TEXT, TEXT, BIGINT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_video_asset(UUID, TEXT, TEXT, TEXT, BIGINT, NUMERIC, TEXT) TO service_role;
