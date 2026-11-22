# VIBR

African builder network. This repository is the Create React App source that compiles.

It is a clickable product prototype, not a finished SaaS. See the notes below before connecting a database.

## What is actually in the code

- One React file: `src/App.js` (about 4,800 lines, 54 components, 35 routes).
- Screens for builder, investor, company, and admin.
- Live data calls exist for auth, posts, votes, comments, bounties, leaderboard, messages, and notifications.
- If those calls return nothing, the screen shows hardcoded demo people and projects.
- Several fetches are never rendered. Bounties always draw the `BOUNTIES` constant. Messages always list `DM_CONTACTS`. `displayBounties` and `liveConvos` are unused.
- Paystack runs in the browser only. There is no payment webhook. If Paystack is missing, premium still flips to a success screen.
- Admin "12,841 members" and "₦4.2M" are literals. A real count of 0 is replaced by those literals because the code uses `stats.users || "12,841"`.
- `schema.supabase.sql` is written for Supabase. It will not run on Neon: `profiles` references `auth.users`, and 58 policies call `auth.uid()`.

## Run

```bash
npm install
npm start
```

The UI loads with demo data when `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are unset.

## Deploy

Vercel project settings must use `CI=false` for the build. Create React App turns the existing unused-variable warnings into a failed build when `CI=true`, which Vercel sets by default. `vercel.json` already sets `CI=false`.

Do not put database keys in the repo. Add them in Vercel as `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` if you stay on Supabase.

## Database

Stay on Supabase until auth is rewritten. Neon is Postgres only. It does not replace Supabase Auth, Realtime, or Storage, and this schema cannot be applied there as-is.
