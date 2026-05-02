// Analyzes a room photo and returns furniture suggestions as structured JSON
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an interior design expert for Valyrian Craft furniture. Analyze the user's room photo and recommend furniture pieces. Be specific, practical and consider the existing style, lighting, and space. Prices in Indian Rupees (₹).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, notes } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
                roomType: { type: "string", description: "e.g. Living room, Bedroom" },
                styleDetected: { type: "string", description: "Existing decor style" },
                colorPalette: { type: "array", items: { type: "string" }, description: "Dominant colors" },
                overallAssessment: { type: "string", description: "2-3 sentence assessment of the space" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      piece: { type: "string", description: "Furniture piece name" },
                      category: { type: "string", enum: ["seating", "tables", "beds", "storage", "office"] },
                      reason: { type: "string", description: "Why this piece fits" },
                      suggestedWood: { type: "string" },
                      suggestedStyle: { type: "string" },
                      estimatedPriceINR: { type: "number" },
                      placement: { type: "string", description: "Where to place it" },
                    },
                    required: ["piece", "category", "reason", "suggestedWood", "suggestedStyle", "estimatedPriceINR", "placement"],
                  },
                },
                designTips: { type: "array", items: { type: "string" } },
              },
              required: ["roomType", "styleDetected", "colorPalette", "overallAssessment", "recommendations", "designTips"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "room_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const analysis = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-room error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
