// Analyzes a room photo, returns furniture suggestions AND a redesigned photo
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an interior design expert for Valyrian Craft furniture. Analyze the user's room photo and recommend furniture pieces. Be specific, practical and consider the existing style, lighting, and space. Prices in Indian Rupees (₹).`;

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function analyzeRoom(LOVABLE_API_KEY: string, imageBase64: string, notes: string) {
  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this room and recommend furniture. ${notes ? "User notes: " + notes : ""}` },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "room_analysis",
          description: "Return structured room analysis & furniture recommendations.",
          parameters: {
            type: "object",
            properties: {
              roomType: { type: "string" },
              styleDetected: { type: "string" },
              colorPalette: { type: "array", items: { type: "string" } },
              overallAssessment: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    piece: { type: "string" },
                    category: { type: "string", enum: ["seating", "tables", "beds", "storage", "office"] },
                    reason: { type: "string" },
                    suggestedWood: { type: "string" },
                    suggestedStyle: { type: "string" },
                    estimatedPriceINR: { type: "number" },
                    placement: { type: "string" },
                  },
                  required: ["piece", "category", "reason", "suggestedWood", "suggestedStyle", "estimatedPriceINR", "placement"],
                },
              },
              designTips: { type: "array", items: { type: "string" } },
              redesignPrompt: {
                type: "string",
                description: "A vivid, specific prompt describing how to add the recommended furniture to the existing room photo. Reference exact placements, woods, styles, and how it integrates with current lighting/walls/floor. Keep architecture identical.",
              },
            },
            required: ["roomType", "styleDetected", "colorPalette", "overallAssessment", "recommendations", "designTips", "redesignPrompt"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "room_analysis" } },
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`analysis_failed:${response.status}:${t}`);
  }
  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No structured response from AI");
  return JSON.parse(toolCall.function.arguments);
}

async function generateRedesign(LOVABLE_API_KEY: string, imageBase64: string, redesignPrompt: string) {
  const editInstruction = `Edit this exact room photograph to add the recommended furniture. Keep the room's architecture, walls, windows, floor, lighting, and perspective IDENTICAL — do not change the camera angle or layout. Realistically place the furniture as described, matching shadows, scale, and lighting so it looks photoreal. ${redesignPrompt}`;

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: editInstruction },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("redesign_failed", response.status, t);
    return null;
  }
  const data = await response.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return url || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, notes } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const analysis = await analyzeRoom(LOVABLE_API_KEY, imageBase64, notes || "");

    // Generate the redesigned room photo with furniture added
    const redesignedImage = await generateRedesign(
      LOVABLE_API_KEY,
      imageBase64,
      analysis.redesignPrompt || `Add: ${analysis.recommendations.map((r: any) => `${r.piece} (${r.suggestedWood}, ${r.suggestedStyle}) ${r.placement}`).join("; ")}`
    );

    return new Response(JSON.stringify({ analysis, redesignedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("analyze-room error:", e);
    const msg = e?.message || "Unknown error";
    if (msg.includes(":429:")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg.includes(":402:")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
