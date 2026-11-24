const { createClient } = require("@supabase/supabase-js");

let cachedAdmin = null;

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    const error = new Error("Server configuration is incomplete: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    error.statusCode = 503;
    throw error;
  }
  if (!cachedAdmin) {
    cachedAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }
  return cachedAdmin;
}

async function requireUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    const error = new Error("Sign in to upload a video.");
    error.statusCode = 401;
    throw error;
  }
  const admin = getAdminClient();
  const { data, error: authError } = await admin.auth.getUser(token);
  if (authError || !data?.user) {
    const error = new Error("Your session is invalid or has expired. Sign in again.");
    error.statusCode = 401;
    throw error;
  }
  return { admin, user: data.user };
}

function streamConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!accountId || !apiToken || !customerCode) {
    const error = new Error("Cloudflare Stream is not configured. Add the VIBR Cloudflare Stream environment variables in Vercel.");
    error.statusCode = 503;
    throw error;
  }
  return { accountId, apiToken, customerCode };
}

function jsonError(res, error) {
  const status = error.statusCode || 500;
  res.status(status).json({ error: status >= 500 && status !== 503 ? "The video service could not complete this request." : error.message });
}

module.exports = { getAdminClient, requireUser, streamConfig, jsonError };
