export const config = {
  maxDuration: 60,
};

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
    imageBase64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("[analyse] Image fetched, size:", arrayBuffer.byteLength, "bytes, type:", mediaType);
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
