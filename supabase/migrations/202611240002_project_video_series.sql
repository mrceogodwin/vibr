-- VIBR project video uploads and build-series episodes.
-- Apply this migration in the Supabase SQL Editor for the VIBR project.
-- Videos are public for playback; uploads and modifications are restricted to the owner folder.

CREATE TABLE IF NOT EXISTS public.project_series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS series_id UUID,
  ADD COLUMN IF NOT EXISTS episode_number INTEGER,
  ADD COLUMN IF NOT EXISTS episode_title TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_series_id_fkey'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_series_id_fkey
      FOREIGN KEY (series_id) REFERENCES public.project_series(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_episode_number_positive'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_episode_number_positive
      CHECK (episode_number IS NULL OR episode_number >= 1);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_series_episode
  ON public.posts(series_id, episode_number)
  WHERE series_id IS NOT NULL AND episode_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_series_author_updated
  ON public.project_series(author_id, updated_at DESC);

ALTER TABLE public.project_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project series are public" ON public.project_series;
CREATE POLICY "Project series are public"
  ON public.project_series FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Builders create own project series" ON public.project_series;
CREATE POLICY "Builders create own project series"
  ON public.project_series FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors update own project series" ON public.project_series;
CREATE POLICY "Authors update own project series"
  ON public.project_series FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors delete own project series" ON public.project_series;
CREATE POLICY "Authors delete own project series"
  ON public.project_series FOR DELETE
  USING (auth.uid() = author_id);

-- A post can only be attached to a series belonging to the same author.
CREATE OR REPLACE FUNCTION public.validate_post_series_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  series_author UUID;
BEGIN
  IF NEW.series_id IS NULL THEN
    NEW.episode_number := NULL;
    NEW.episode_title := NULL;
    RETURN NEW;
  END IF;

  SELECT author_id
    INTO series_author
    FROM public.project_series
    WHERE id = NEW.series_id;

  IF series_author IS NULL OR series_author <> NEW.author_id THEN
    RAISE EXCEPTION 'You can only add updates to your own project series.';
  END IF;

  IF NEW.episode_number IS NULL OR NEW.episode_number < 1 THEN
    RAISE EXCEPTION 'A project-series update must have a positive episode number.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_validate_series_owner ON public.posts;
CREATE TRIGGER trg_posts_validate_series_owner
  BEFORE INSERT OR UPDATE OF series_id, author_id, episode_number
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_post_series_owner();

-- Create a public-read video bucket with a 50 MB per-file limit.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-videos',
  'project-videos',
  TRUE,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Project videos are publicly readable" ON storage.objects;
CREATE POLICY "Project videos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-videos');

DROP POLICY IF EXISTS "Builders upload videos to own folder" ON storage.objects;
CREATE POLICY "Builders upload videos to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-videos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Builders update videos in own folder" ON storage.objects;
CREATE POLICY "Builders update videos in own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-videos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'project-videos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Builders delete videos in own folder" ON storage.objects;
CREATE POLICY "Builders delete videos in own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-videos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
