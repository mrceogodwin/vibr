const { requireUser, streamConfig, jsonError } = require("../../lib/video-server");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { admin, user } = await requireUser(req);
    const assetId = String(req.body?.assetId || "");
    if (!/^[0-9a-f-]{36}$/i.test(assetId)) return res.status(400).json({ error: "Invalid video asset." });

    const { data: asset, error: readError } = await admin
      .from("video_assets")
      .select("id,status,stream_uid")
      .eq("id", assetId)
      .eq("author_id", user.id)
      .single();
    if (readError || !asset) return res.status(404).json({ error: "Video upload record was not found." });

    // Do not trust a browser's "upload complete" callback alone. Confirm the media
    // object exists in Stream before moving its database state out of uploading.
    const { accountId, apiToken } = streamConfig();
    const streamResponse = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/stream/" + asset.stream_uid,
      { headers: { Authorization: "Bearer " + apiToken } }
    );
    if (!streamResponse.ok) {
      const details = await streamResponse.text().catch(() => "");
      console.error("Cloudflare Stream completion check failed:", streamResponse.status, details.slice(0, 500));
      return res.status(409).json({ error: "Cloudflare has not confirmed the completed upload yet. Retry in a moment." });
    }
    const streamPayload = await streamResponse.json();
    const streamVideo = streamPayload?.result;
    if (!streamPayload?.success || !streamVideo?.uid) {
      return res.status(409).json({ error: "Cloudflare has not confirmed the completed upload yet. Retry in a moment." });
    }
    const status = streamVideo.status?.state === "error"
      ? "error"
      : streamVideo.readyToStream === true
        ? "ready"
        : "processing";
    const update = {
      status,
      thumbnail_url: streamVideo.thumbnail || null,
      hls_url: streamVideo.playback?.hls || null,
      dash_url: streamVideo.playback?.dash || null,
      updated_at: new Date().toISOString()
    };
    if (status === "ready") update.ready_at = new Date().toISOString();
    const { error: updateError } = await admin
      .from("video_assets")
      .update(update)
      .eq("id", assetId)
      .eq("author_id", user.id);
    if (updateError) throw updateError;
    return res.status(200).json({ ok: true, status });
  } catch (error) {
    jsonError(res, error);
  }
};
