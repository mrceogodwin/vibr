const { requireUser, streamConfig, jsonError } = require("../../lib/video-server");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { admin, user } = await requireUser(req);
    const { accountId, apiToken, customerCode } = streamConfig();
    const fileName = String(req.body?.fileName || "project-video").slice(0, 180);
    const fileSize = Number(req.body?.fileSize);
    const mimeType = String(req.body?.mimeType || "");
    const durationSeconds = Number(req.body?.durationSeconds);

    if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize >= 30 * 1024 * 1024 * 1024) {
      return res.status(400).json({ error: "Choose a video file up to 30 GB." });
    }
    if (!mimeType.startsWith("video/")) {
      return res.status(400).json({ error: "The selected file is not a supported video." });
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 3595) {
      return res.status(400).json({ error: "Videos must be shorter than 60 minutes and have readable duration metadata." });
    }

    // Limit a single account to three active uploads/encodes at a time.
    // This protects against accidental repeated clicks and basic upload abuse.
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("video_assets")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .in("status", ["uploading", "processing"])
      .gte("created_at", cutoff);
    if (countError) throw countError;
    if ((count || 0) >= 3) {
      return res.status(429).json({ error: "You already have three videos uploading or processing. Wait for one to finish before starting another." });
    }

    const maxDurationSeconds = Math.min(3600, Math.ceil(durationSeconds) + 5);
    const expiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const b64 = value => Buffer.from(String(value), "utf8").toString("base64");
    const uploadMetadata = [
      "maxDurationSeconds " + b64(maxDurationSeconds),
      "expiry " + b64(expiry),
      "name " + b64(fileName)
    ].join(",");

    const cloudflareResponse = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/stream?direct_user=true",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiToken,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": String(fileSize),
          "Upload-Creator": user.id,
          "Upload-Metadata": uploadMetadata
        }
      }
    );

    if (!cloudflareResponse.ok) {
      const details = await cloudflareResponse.text().catch(() => "");
      console.error("Cloudflare Stream upload provisioning failed:", cloudflareResponse.status, details.slice(0, 800));
      return res.status(502).json({ error: "Cloudflare could not create the video upload. Please retry." });
    }

    const uploadUrl = cloudflareResponse.headers.get("Location");
    if (!uploadUrl) {
      return res.status(502).json({ error: "Cloudflare did not return a resumable upload URL." });
    }
    // Cloudflare explicitly recommends reading the UID from this response header,
    // not parsing it from the opaque TUS upload URL.
    const uid = cloudflareResponse.headers.get("stream-media-id");
    if (!uid || !/^[a-zA-Z0-9_-]{20,80}$/.test(uid)) {
      return res.status(502).json({ error: "Cloudflare did not return a valid stream media ID." });
    }

    const iframeUrl = "https://customer-" + customerCode.replace(/^customer-/, "") + ".cloudflarestream.com/" + uid + "/iframe";
    const { data: asset, error: insertError } = await admin
      .from("video_assets")
      .insert({
        author_id: user.id,
        stream_uid: uid,
        original_filename: fileName,
        mime_type: mimeType,
        file_size_bytes: fileSize,
        duration_seconds: Number(durationSeconds.toFixed(2)),
        status: "uploading",
        iframe_url: iframeUrl
      })
      .select("id")
      .single();

    if (insertError) {
      // Avoid leaving an untracked Stream object if the database insert fails.
      await fetch("https://api.cloudflare.com/client/v4/accounts/" + accountId + "/stream/" + uid, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + apiToken }
      }).catch(() => {});
      throw insertError;
    }

    return res.status(201).json({ assetId: asset.id, uid, uploadUrl, iframeUrl });
  } catch (error) {
    jsonError(res, error);
  }
};
