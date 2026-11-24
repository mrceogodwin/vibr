# VIBR Cloudflare Stream video setup

This release moves **new** video uploads to Cloudflare Stream. Existing videos stored in the legacy Supabase `project-videos` bucket remain readable.

## Provider layout

- Vercel: VIBR web app and small server-side upload authorization/webhook functions.
- Supabase: the only database and authentication provider.
- Cloudflare Stream: direct video upload, encoding, storage, thumbnails and playback.

Video bytes never pass through a Vercel function or Supabase Storage.

## 1. Apply the Supabase migrations

Apply these in order in the VIBR Supabase SQL Editor:

1. `supabase/migrations/202611240002_project_video_series.sql`
2. `supabase/migrations/202611240003_cloudflare_stream_video_assets.sql`

The first migration creates the existing project-series schema and legacy media URL columns, without creating a Supabase Storage video bucket. The second creates the private video-asset metadata table, upload-slot reservation function and post relationship. Do not skip the order.

## 2. Create a Cloudflare Stream API token

Create an account API token with the minimum Stream permissions required to create uploads, delete abandoned uploads and manage the Stream webhook. Keep the token private. Never place it in a `REACT_APP_*` variable or in frontend source code.

From the Cloudflare Stream dashboard, note:
- Account ID
- Stream customer code (the code only; the player URL adds `customer-` automatically)

## 3. Add server-side Vercel environment variables

Add the following to the VIBR Vercel project for **Production, Preview and Development** as appropriate:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | VIBR Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_STREAM_API_TOKEN` | Server-only Cloudflare Stream API token |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | Public Stream customer code used to form iframe playback URLs |
| `CLOUDFLARE_STREAM_WEBHOOK_SECRET` | Signing secret returned when registering the Stream webhook |

The existing `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` remain the browser Supabase configuration. **Do not expose the service-role key or Cloudflare API token using a `REACT_APP_` prefix.**

After adding variables, redeploy VIBR so the server functions receive them.

## 4. Register the Stream webhook

Register one Cloudflare Stream webhook for the production VIBR endpoint:

```http
PUT https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/webhook
Authorization: Bearer <CLOUDFLARE_STREAM_API_TOKEN>
Content-Type: application/json

{"notificationUrl":"https://<YOUR-PRODUCTION-DOMAIN>/api/videos/webhook"}
```

Copy the `secret` returned by Cloudflare into `CLOUDFLARE_STREAM_WEBHOOK_SECRET` in Vercel, then redeploy. Stream allows one webhook subscription per account. If another application already uses the account's Stream webhook, coordinate before replacing it.

## 5. Upload behavior

- Browser selects the original phone video and reads its duration locally.
- Vercel verifies the signed-in Supabase user and provisions a one-time TUS upload URL.
- The browser uploads directly to Cloudflare Stream with resumable chunks and retry handling.
- Supabase stores only video metadata, owner, status and the player reference.
- The signed Cloudflare webhook changes the asset to `ready` or `error`.
- VIBR displays the Cloudflare player when the asset is ready. Existing Supabase Storage video URLs continue using the legacy HTML video player.

The current client supports files up to Cloudflare Stream's documented default 30 GB upload size and videos up to 60 minutes. The Vercel function validates each request; the user-facing app does not send video bytes through Vercel.

## 6. Capacity requirement before large-scale launch

Cloudflare Stream documents a default limit of 120 videos queued or being encoded simultaneously. This is not a one-million-upload guarantee. Before marketing or load-testing a one-million-user launch, contact Cloudflare Support and request a written concurrency increase based on the forecast upload rate. The queue/processing status in VIBR is designed to tolerate processing delay, but the provider's account quota still applies.

Also load-test the Vercel authorization endpoint and Supabase metadata writes, and monitor Stream minutes stored/delivered. A successful build does not prove production capacity.
