const crypto = require("crypto");
const { getAdminClient } = require("../../lib/video-server");

module.exports.config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const fields = Object.fromEntries(signatureHeader.split(",").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? [part, ""] : [part.slice(0, index), part.slice(index + 1)];
  }));
  const timestamp = Number(fields.time);
  const supplied = fields.sig1 || "";
  if (!Number.isFinite(timestamp) || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const source = Buffer.concat([Buffer.from(String(timestamp) + ".", "utf8"), rawBody]);
  const expected = crypto.createHmac("sha256", secret).update(source).digest();
  const actual = Buffer.from(supplied, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }
  try {
    const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
    if (!secret) return res.status(503).send("Webhook is not configured");
    const rawBody = await readRawBody(req);
    if (!verifySignature(rawBody, req.headers["webhook-signature"], secret)) {
      return res.status(401).send("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    if (!payload?.uid) return res.status(400).send("Missing Stream video UID");

    const state = payload.status?.state;
    const ready = state === "ready" && payload.readyToStream === true;
    const failed = state === "error";
    const update = {
      status: ready ? "ready" : failed ? "error" : "processing",
      thumbnail_url: payload.thumbnail || null,
      hls_url: payload.playback?.hls || null,
      dash_url: payload.playback?.dash || null,
      duration_seconds: Number.isFinite(Number(payload.duration)) && Number(payload.duration) > 0 ? Number(payload.duration) : undefined,
      error_code: failed ? (payload.status?.errReasonCode || payload.status?.errorReasonCode || null) : null,
      error_message: failed ? (payload.status?.errReasonText || payload.status?.errorReasonText || null) : null,
      updated_at: new Date().toISOString()
    };
    if (ready) update.ready_at = new Date().toISOString();

    const { error } = await getAdminClient()
      .from("video_assets")
      .update(update)
      .eq("stream_uid", String(payload.uid));
    if (error) throw error;
    return res.status(200).send("ok");
  } catch (error) {
    console.error("Cloudflare Stream webhook error:", error);
    return res.status(500).send("Webhook processing failed");
  }
};
