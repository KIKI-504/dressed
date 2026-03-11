import sharp from "sharp";

export const config = {
  maxDuration: 60,
};

// ── Image compression ────────────────────────────────────────────────────────
// Resizes to max 1500px on the longest side and compresses to JPEG ~80 quality.
// Only runs if the image exceeds 4.5 MB — small images are passed through as-is.

const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB
const MAX_DIMENSION = 1500;           // px

async function compressImageIfNeeded(buffer, originalMediaType) {
  if (buffer.byteLength <= MAX_BYTES) {
    // Small enough — no compression needed
    return { buffer, mediaType: originalMediaType };
  }

  console.log(
    `[analyse] Image is ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB — compressing...`
  );

  const compressed = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",          // preserve aspect ratio, never upscale
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  console.log(
    `[analyse] Compressed to ${(compressed.byteLength / 1024 / 1024).toFixed(2)} MB`
  );

  return { buffer: compressed, mediaType: "image/jpeg" };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  console.log("[analyse] Starting for URL:", imageUrl);

  // ── Step 1: Fetch the image ──────────────────────────────────────────────
  let imageBase64;
  let mediaType;

  try {
    const imgResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000), // 15s timeout for image fetch
    });

    if (!imgResponse.ok) {
      throw new Error(`Image fetch failed: ${imgResponse.status} ${imgResponse.statusText}`);
    }

    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    // Normalise to a type Anthropic accepts
    mediaType = contentType.split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mediaType)) {
      mediaType = "image/jpeg";
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    console.log("[analyse] Image fetched, size:", rawBuffer.byteLength, "bytes, type:", mediaType);

    // ── Compress if needed ─────────────────────────────────────────────────
    const { buffer: finalBuffer, mediaType: finalMediaType } =
      await compressImageIfNeeded(rawBuffer, mediaType);

    mediaType = finalMediaType;
    imageBase64 = finalBuffer.toString("base64");
  } catch (err) {
    console.error("[analyse] Image fetch error:", err);
    return res.status(502).json({ error: "Failed to fetch image", detail: err.message });
  }

  // ── Step 2: Call Claude API ──────────────────────────────────────────────
  let tags;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(30000), // 30s timeout for Claude
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `You are a fashion stylist analysing an outfit photo for a personal wardrobe diary app. 
Analyse this outfit and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

The JSON must have exactly these keys:
{
  "garments": ["list", "of", "clothing items"],
  "colours": ["list", "of", "colours"],
  "style": ["list", "of", "style descriptors"],
  "occasion": ["list", "of", "occasions"],
  "season": ["list", "of", "seasons"]
}

Keep each list concise (2–5 items). Use lowercase. Be specific and accurate.`,
              },
            ],
          },
        ],
      }),
    });

    const claudeData = await anthropicRes.json();
    console.log("[analyse] Claude status:", anthropicRes.status);
    console.log("[analyse] Claude response:", JSON.stringify(claudeData).slice(0, 500));

    if (!anthropicRes.ok) {
      throw new Error(claudeData.error?.message || `Claude API error ${anthropicRes.status}`);
    }

    // Extract text content from Claude's response
    const rawText = claudeData.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!rawText) {
      throw new Error("Claude returned empty content");
    }

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    tags = JSON.parse(cleaned);
    console.log("[analyse] Parsed tags:", tags);
  } catch (err) {
    console.error("[analyse] Claude API error:", err);
    return res.status(502).json({ error: "Failed to get tags from Claude", detail: err.message });
  }

  // ── Step 3: Return tags ──────────────────────────────────────────────────
  return res.status(200).json({ tags });
}
