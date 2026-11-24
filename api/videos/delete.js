const { requireUser, streamConfig, jsonError } = require("../../lib/video-server");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { admin, user } = await requireUser(req);
    const { accountId, apiToken } = streamConfig();
    const assetId = String(req.body?.assetId || "");
    if (!/^[0-9a-f-]{36}$/i.test(assetId)) return res.status(400).json({ error: "Invalid video asset." });

    const { data: asset, error: readError } = await admin
      .from("video_assets")
      .select("id,stream_uid")
      .eq("id", assetId)
      .eq("author_id", user.id)
      .single();
    if (readError || !asset) return res.status(404).json({ error: "Video asset was not found." });

    const cfResponse = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/stream/" + asset.stream_uid,
      { method: "DELETE", headers: { Authorization: "Bearer " + apiToken } }
    );
    if (!cfResponse.ok && cfResponse.status !== 404) {
      const details = await cfResponse.text().catch(() => "");
      console.error("Cloudflare video cleanup failed:", cfResponse.status, details.slice(0, 500));
      return res.status(502).json({ error: "The unused video could not be cleaned up yet." });
    }
    const { error: deleteError } = await admin.from("video_assets").delete().eq("id", assetId).eq("author_id", user.id);
    if (deleteError) throw deleteError;
    return res.status(200).json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
};
