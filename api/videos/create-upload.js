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
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 3600) {
      return res.status(400).json({ error: "Videos must be shorter than 60 minutes and have readable duration metadata." });
    }

    const maxDurationSeconds = Math.min(3600, Math.ceil(durationSeconds) + 2);
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
      if (cloudflareResponse.status === 429) {
        res.setHeader("Retry-After", "60");
        return res.status(429).json({ error: "Video upload capacity is temporarily full. Your VIBR post is safe; please retry the video upload in about a minute." });
      }
      if (cloudflareResponse.status === 413) {
        return res.status(413).json({ error: "This video exceeds the upload or storage capacity currently available for VIBR." });
      }
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
    const { data: assetId, error: insertError } = await admin.rpc("reserve_video_asset", {
      p_author_id: user.id,
      p_stream_uid: uid,
      p_original_filename: fileName,
      p_mime_type: mimeType,
      p_file_size_bytes: fileSize,
      p_duration_seconds: Number(durationSeconds.toFixed(2)),
      p_iframe_url: iframeUrl
    });

    if (insertError || !assetId) {
      // Avoid leaving an untracked Stream object if the database reservation fails.
      await fetch("https://api.cloudflare.com/client/v4/accounts/" + accountId + "/stream/" + uid, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + apiToken }
      }).catch(() => {});
      if ((insertError?.message || "").includes("upload_limit_exceeded")) {
        return res.status(429).json({ error: "You already have three videos uploading or processing. Wait for one to finish before starting another." });
      }
      throw insertError || new Error("VIBR could not reserve this video upload.");
    }

    return res.status(201).json({ assetId, uid, uploadUrl, iframeUrl });
  } catch (error) {
    jsonError(res, error);
  }
};
