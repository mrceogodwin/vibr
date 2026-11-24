const { requireUser, jsonError } = require("../../lib/video-server");

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
      .select("id,status")
      .eq("id", assetId)
      .eq("author_id", user.id)
      .single();
    if (readError || !asset) return res.status(404).json({ error: "Video upload record was not found." });

    if (asset.status === "uploading") {
      const { error: updateError } = await admin
        .from("video_assets")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", assetId)
        .eq("author_id", user.id);
      if (updateError) throw updateError;
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    jsonError(res, error);
  }
};
