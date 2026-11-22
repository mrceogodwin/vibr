-- SUPERBASE ONLY. Do not run this on Neon.
-- It references auth.users and auth.uid(), which Neon does not provide.
-- Running it on Neon fails at the profiles table.

-- ─────────────────────────────────────────────────────────────────────────────
-- VIBR DATABASE SCHEMA — Run this entire file in your Supabase SQL Editor
-- Go to: supabase.com → your project → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per user. Created automatically after signup via trigger.
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        UNIQUE,
  full_name     TEXT,
  role          TEXT        NOT NULL DEFAULT 'builder'
                            CHECK (role IN ('builder','investor','company','admin')),
  email         TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  country       TEXT,
  city          TEXT,
  website       TEXT,
  linkedin_url  TEXT,
  github_url    TEXT,
  stack         TEXT[],           -- e.g. ['React','Node.js','Python']
  vibe_points   INTEGER     NOT NULL DEFAULT 0,
  rank          TEXT        NOT NULL DEFAULT 'Seedling'
                            CHECK (rank IN ('Seedling','Builder','Vibe Lord','Legend','Icon')),
  -- investor-specific
  fund_name     TEXT,
  investor_type TEXT,
  check_min     INTEGER,
  check_max     INTEGER,
  focus_sectors TEXT[],
  verified      BOOLEAN     NOT NULL DEFAULT FALSE,
  -- company-specific
  company_name  TEXT,
  company_type  TEXT,
  company_size  TEXT,
  -- meta
  is_premium    BOOLEAN     NOT NULL DEFAULT FALSE,
  premium_tier  TEXT        DEFAULT 'free'
                            CHECK (premium_tier IN ('free','pro','lord')),
  premium_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POSTS (project drops) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  tags        TEXT[],
  niche       TEXT,
  open_source BOOLEAN     NOT NULL DEFAULT FALSE,
  open_collab BOOLEAN     NOT NULL DEFAULT FALSE,
  has_bounty  BOOLEAN     NOT NULL DEFAULT FALSE,
  image_url   TEXT,
  demo_url    TEXT,
  github_url  TEXT,
  vote_count  INTEGER     NOT NULL DEFAULT 0,
  comment_count INTEGER   NOT NULL DEFAULT 0,
  view_count  INTEGER     NOT NULL DEFAULT 0,
  is_featured BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── VOTES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CONVERSATIONS (DM threads) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_a   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    TEXT,
  unread_a        INTEGER     NOT NULL DEFAULT 0,
  unread_b        INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_a, participant_b)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,  -- 'upvote','comment','collab','message','bounty','rank','hackathon'
  title      TEXT        NOT NULL,
  body       TEXT,
  link       TEXT,        -- frontend route to navigate to on click
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  actor_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COLLABS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collabs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project     TEXT        NOT NULL,
  description TEXT,
  roles       TEXT[],     -- roles needed: ['Frontend Dev','Backend Dev']
  tags        TEXT[],
  country     TEXT,
  status      TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collab_requests (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  collab_id  UUID        NOT NULL REFERENCES collabs(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message    TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collab_id, sender_id)
);

-- ─── BOUNTIES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bounties (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  amount       INTEGER     NOT NULL,        -- USD cents e.g. 50000 = $500
  currency     TEXT        NOT NULL DEFAULT 'USD',
  deadline     DATE,
  tags         TEXT[],
  status       TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','closed')),
  winner_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bounty_applications (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id    UUID        NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  applicant_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bounty_id, applicant_id)
);

-- ─── CHALLENGES (company-sponsored lablab-style bounties) ─────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  prize        INTEGER     NOT NULL,    -- USD cents
  deadline     DATE,
  tracks       TEXT[],
  judging_info TEXT,
  status       TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','judging','closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  builder_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track        TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  demo_url     TEXT        NOT NULL,
  github_url   TEXT,
  description  TEXT,
  rating       INTEGER     CHECK (rating BETWEEN 1 AND 5),
  feedback     TEXT,
  shortlisted  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, builder_id)
);

-- ─── SQUADS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS squads (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  handle      TEXT        UNIQUE NOT NULL,
  bio         TEXT,
  emoji       TEXT        NOT NULL DEFAULT '🔥',
  color       TEXT        NOT NULL DEFAULT '#D92B2B',
  is_open     BOOLEAN     NOT NULL DEFAULT TRUE,
  captain_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drop_count  INTEGER     NOT NULL DEFAULT 0,
  win_count   INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_members (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id   UUID        NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'Member' CHECK (role IN ('Captain','Member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (squad_id, user_id)
);

CREATE TABLE IF NOT EXISTS squad_invites (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id     UUID        NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  from_user_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SQUAD CHAT MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS squad_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id   UUID        NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SPACES (topic channels) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spaces (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  emoji       TEXT        NOT NULL DEFAULT '💬',
  tags        TEXT[],
  member_count INTEGER    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS space_memberships (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (space_id, user_id)
);

CREATE TABLE IF NOT EXISTS space_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id   UUID        NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CHAPTERS (country hubs) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT    NOT NULL UNIQUE,   -- 'Nigeria Hub'
  country_code TEXT    NOT NULL,          -- 'NG'
  flag         TEXT    NOT NULL,          -- '🇳🇬'
  description  TEXT,
  member_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chapter_memberships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id, user_id)
);

CREATE TABLE IF NOT EXISTS chapter_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID        NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HACKATHONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hackathons (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  emoji        TEXT        NOT NULL DEFAULT '⚡',
  sponsor      TEXT,
  prize        INTEGER,          -- USD cents
  theme        TEXT,
  description  TEXT,
  rules        TEXT[],
  prizes       JSONB,            -- [{"place":"1st","amount":1200}]
  tags         TEXT[],
  status       TEXT        NOT NULL DEFAULT 'upcoming'
                           CHECK (status IN ('upcoming','live','ended')),
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_registrations (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id  UUID        NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, user_id)
);

CREATE TABLE IF NOT EXISTS hackathon_messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID        NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  is_bot       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PREMIUM SUBSCRIPTIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier                 TEXT        NOT NULL CHECK (tier IN ('pro','lord')),
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','cancelled','expired')),
  paystack_customer_id TEXT,
  paystack_sub_code    TEXT,
  amount               INTEGER     NOT NULL,   -- kobo (₦3500 = 350000)
  currency             TEXT        NOT NULL DEFAULT 'NGN',
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID       NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- ─── INVESTOR BOOKMARKS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_bookmarks (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  builder_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investor_id, builder_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Auto-create profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  chapter_id  UUID;
  user_country TEXT;
  chapter_name TEXT;
BEGIN
  -- Insert profile row
  INSERT INTO public.profiles (
    id, email, full_name, role, country, username
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'builder'),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),' ','_'))
       || '_' || SUBSTRING(NEW.id::TEXT, 1, 4)
  );

  -- Auto-assign to country chapter
  user_country := COALESCE(NEW.raw_user_meta_data->>'country', '');
  chapter_name := CASE
    WHEN user_country ILIKE '%nigeria%'      THEN 'Nigeria Hub'
    WHEN user_country ILIKE '%kenya%'        THEN 'Kenya Hub'
    WHEN user_country ILIKE '%ghana%'        THEN 'Ghana Hub'
    WHEN user_country ILIKE '%south africa%' THEN 'South Africa Hub'
    WHEN user_country ILIKE '%ethiopia%'     THEN 'Ethiopia Hub'
    WHEN user_country ILIKE '%senegal%'      THEN 'Senegal Hub'
    WHEN user_country ILIKE '%rwanda%'       THEN 'Rwanda Hub'
    WHEN user_country ILIKE '%egypt%'        THEN 'Egypt Hub'
    ELSE NULL
  END;

  IF chapter_name IS NOT NULL THEN
    SELECT id INTO chapter_id FROM public.chapters WHERE name = chapter_name;
    IF chapter_id IS NOT NULL THEN
      INSERT INTO public.chapter_memberships (chapter_id, user_id)
      VALUES (chapter_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Update post vote count when votes change
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
    -- Award vibe points to post author
    UPDATE profiles SET vibe_points = vibe_points + 2
    WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE profiles SET vibe_points = GREATEST(vibe_points - 2, 0)
    WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_vote ON votes;
CREATE TRIGGER on_vote
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- 3. Update comment count when comments change
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment ON comments;
CREATE TRIGGER on_comment
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- 4. Auto-rank builder based on vibe points
CREATE OR REPLACE FUNCTION update_rank()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.rank := CASE
    WHEN NEW.vibe_points >= 10000 THEN 'Icon'
    WHEN NEW.vibe_points >= 5000  THEN 'Legend'
    WHEN NEW.vibe_points >= 2000  THEN 'Vibe Lord'
    WHEN NEW.vibe_points >= 500   THEN 'Builder'
    ELSE 'Seedling'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_rank();

-- 5. Update conversation last_message and timestamp
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.content, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message ON messages;
CREATE TRIGGER on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collabs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_invites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_memberships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters                ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_bookmarks      ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "Profiles are public"        ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users manage own profile"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Trigger inserts profile"    ON profiles FOR INSERT WITH CHECK (TRUE);

-- ── POSTS ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Posts are public"           ON posts FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users post"   ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own posts"   ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors delete own posts"   ON posts FOR DELETE USING (auth.uid() = author_id);

-- ── VOTES ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Votes are public"           ON votes FOR SELECT USING (TRUE);
CREATE POLICY "Users vote once"            ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes"     ON votes FOR DELETE USING (auth.uid() = user_id);

-- ── COMMENTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Comments are public"        ON comments FOR SELECT USING (TRUE);
CREATE POLICY "Auth users comment"         ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete comments"    ON comments FOR DELETE USING (auth.uid() = author_id);

-- ── CONVERSATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "Participants see convos"    ON conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Auth users create convos"   ON conversations FOR INSERT WITH CHECK (
  auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Trigger updates convos"     ON conversations FOR UPDATE USING (
  auth.uid() = participant_a OR auth.uid() = participant_b);

-- ── MESSAGES ──────────────────────────────────────────────────────────────────
CREATE POLICY "Participants see messages"  ON messages FOR SELECT USING (
  auth.uid() IN (
    SELECT participant_a FROM conversations WHERE id = conversation_id
    UNION
    SELECT participant_b FROM conversations WHERE id = conversation_id
  )
);
CREATE POLICY "Senders insert messages"    ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "Users see own notifs"       ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifs"      ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users mark notifs read"     ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── COLLABS ───────────────────────────────────────────────────────────────────
CREATE POLICY "Collabs are public"         ON collabs FOR SELECT USING (TRUE);
CREATE POLICY "Auth users post collabs"    ON collabs FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update collabs"     ON collabs FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Collab requests public"     ON collab_requests FOR SELECT USING (TRUE);
CREATE POLICY "Auth users request"         ON collab_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Collab owners respond"      ON collab_requests FOR UPDATE USING (
  auth.uid() = (SELECT author_id FROM collabs WHERE id = collab_id));

-- ── BOUNTIES ──────────────────────────────────────────────────────────────────
CREATE POLICY "Bounties are public"        ON bounties FOR SELECT USING (TRUE);
CREATE POLICY "Companies post bounties"    ON bounties FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies update bounties"  ON bounties FOR UPDATE USING (auth.uid() = company_id);

CREATE POLICY "Applications visible"       ON bounty_applications FOR SELECT USING (
  auth.uid() = applicant_id OR
  auth.uid() = (SELECT company_id FROM bounties WHERE id = bounty_id)
);
CREATE POLICY "Builders apply"             ON bounty_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Companies respond"          ON bounty_applications FOR UPDATE USING (
  auth.uid() = (SELECT company_id FROM bounties WHERE id = bounty_id));

-- ── CHALLENGES ────────────────────────────────────────────────────────────────
CREATE POLICY "Challenges are public"      ON challenges FOR SELECT USING (TRUE);
CREATE POLICY "Companies post challenges"  ON challenges FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies update"           ON challenges FOR UPDATE USING (auth.uid() = company_id);

CREATE POLICY "Submissions visible"        ON challenge_submissions FOR SELECT USING (TRUE);
CREATE POLICY "Builders submit"            ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = builder_id);
CREATE POLICY "Companies rate"             ON challenge_submissions FOR UPDATE USING (
  auth.uid() = (SELECT company_id FROM challenges WHERE id = challenge_id));

-- ── SQUADS ────────────────────────────────────────────────────────────────────
CREATE POLICY "Squads are public"          ON squads FOR SELECT USING (TRUE);
CREATE POLICY "Auth users create squads"   ON squads FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Captains update squads"     ON squads FOR UPDATE USING (auth.uid() = captain_id);

CREATE POLICY "Members visible"            ON squad_members FOR SELECT USING (TRUE);
CREATE POLICY "Join squads"                ON squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave squads"               ON squad_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Invites visible to target"  ON squad_invites FOR SELECT USING (
  auth.uid() = to_user_id OR auth.uid() = from_user_id);
CREATE POLICY "Send invites"               ON squad_invites FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Respond to invites"         ON squad_invites FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Squad members see messages" ON squad_messages FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM squad_members WHERE squad_id = squad_messages.squad_id));
CREATE POLICY "Members send messages"      ON squad_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (SELECT user_id FROM squad_members WHERE squad_id = squad_messages.squad_id));

-- ── SPACES ────────────────────────────────────────────────────────────────────
CREATE POLICY "Spaces are public"          ON spaces FOR SELECT USING (TRUE);
CREATE POLICY "Space members visible"      ON space_memberships FOR SELECT USING (TRUE);
CREATE POLICY "Join spaces"                ON space_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave spaces"               ON space_memberships FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Space messages public"      ON space_messages FOR SELECT USING (TRUE);
CREATE POLICY "Auth users send in spaces"  ON space_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── CHAPTERS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Chapters are public"        ON chapters FOR SELECT USING (TRUE);
CREATE POLICY "Chapter members visible"    ON chapter_memberships FOR SELECT USING (TRUE);
CREATE POLICY "Join chapters"              ON chapter_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave chapters"             ON chapter_memberships FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Chapter messages public"    ON chapter_messages FOR SELECT USING (TRUE);
CREATE POLICY "Auth users chat in chapter" ON chapter_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── HACKATHONS ────────────────────────────────────────────────────────────────
CREATE POLICY "Hackathons are public"      ON hackathons FOR SELECT USING (TRUE);
CREATE POLICY "Hack registrations public"  ON hackathon_registrations FOR SELECT USING (TRUE);
CREATE POLICY "Register for hackathon"     ON hackathon_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Hack messages public"       ON hackathon_messages FOR SELECT USING (TRUE);
CREATE POLICY "Registered users chat"      ON hackathon_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    is_bot = TRUE OR
    auth.uid() IN (SELECT user_id FROM hackathon_registrations WHERE hackathon_id = hackathon_messages.hackathon_id)
  ));

-- ── PREMIUM ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users see own subscription" ON premium_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System manages subs"        ON premium_subscriptions FOR ALL USING (TRUE);

-- ── FOLLOWS ───────────────────────────────────────────────────────────────────
CREATE POLICY "Follows are public"         ON follows FOR SELECT USING (TRUE);
CREATE POLICY "Auth users follow"          ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow"                   ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── INVESTOR BOOKMARKS ────────────────────────────────────────────────────────
CREATE POLICY "Investors see own bookmarks" ON investor_bookmarks FOR SELECT USING (auth.uid() = investor_id);
CREATE POLICY "Investors bookmark"          ON investor_bookmarks FOR INSERT WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors remove bookmarks"  ON investor_bookmarks FOR DELETE USING (auth.uid() = investor_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_author       ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created      ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_votes        ON posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_votes_post         ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user         ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post      ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifs_user        ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_unread      ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_bounties_status    ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points    ON profiles(vibe_points DESC);
CREATE INDEX IF NOT EXISTS idx_squad_members_sq   ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA — default chapters, spaces, hackathons
-- (Safe to re-run — uses ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO chapters (name, country_code, flag, description, member_count) VALUES
  ('Nigeria Hub',      'NG', '🇳🇬', 'Largest builder community in West Africa.',     4201),
  ('Kenya Hub',        'KE', '🇰🇪', 'East Africa''s fastest-growing tech hub.',       1842),
  ('Ghana Hub',        'GH', '🇬🇭', 'Building fintech and agritech for West Africa.', 1205),
  ('South Africa Hub', 'ZA', '🇿🇦', 'Cape Town and Joburg builders.',                 980),
  ('Ethiopia Hub',     'ET', '🇪🇹', 'Emerging builders in East Africa.',               412),
  ('Senegal Hub',      'SN', '🇸🇳', 'Francophone West Africa builders.',               387),
  ('Rwanda Hub',       'RW', '🇷🇼', 'Kigali''s tech community on VIBR.',               298),
  ('Egypt Hub',        'EG', '🇪🇬', 'North Africa''s builder community.',               241)
ON CONFLICT (name) DO NOTHING;

INSERT INTO spaces (name, description, emoji, tags) VALUES
  ('React Africa',    'Everything React, Next.js and frontend for African devs', '⚛️', ARRAY['React','Next.js','Frontend']),
  ('AI & ML Builders','Machine learning, LLMs, and AI products built for Africa', '🤖', ARRAY['AI','Python','TensorFlow']),
  ('Fintech Nigeria', 'Paystack, Flutterwave, banking APIs and fintech',          '💸', ARRAY['Fintech','Paystack','Node.js']),
  ('Mobile Devs',     'React Native, Flutter, and mobile-first builders',         '📱', ARRAY['React Native','Flutter','Mobile']),
  ('Web3 Africa',     'Blockchain, DeFi, NFTs and crypto for African market',     '⛓️', ARRAY['Solidity','Web3','Stellar']),
  ('CleanTech',       'Solar, IoT, sustainability and climate tech',               '🌱', ARRAY['IoT','CleanTech','Hardware'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO hackathons (name, emoji, sponsor, prize, theme, description, tags, status, starts_at, ends_at) VALUES
  (
    'Lagos Build Sprint', '⚡', 'Paystack', 200000,
    'Build a fintech tool for the unbanked',
    '48hr hackathon sponsored by Paystack. Build anything that helps underbanked Nigerians access financial services.',
    ARRAY['Fintech','Mobile'],
    'live',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day'
  ),
  (
    'Pan-Africa AI Challenge', '🤖', 'Google Africa', 500000,
    'AI tools built for African languages',
    'Build an AI product that works in at least one African language. Open to all 54 countries.',
    ARRAY['AI/ML','NLP'],
    'upcoming',
    NOW() + INTERVAL '6 days',
    NOW() + INTERVAL '14 days'
  )
ON CONFLICT DO NOTHING;
