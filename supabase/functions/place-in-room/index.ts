// Composite a selected product into the user's room photo at a chosen placement.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { roomImage, productImage, productName, placement, notes } = await req.json();
    if (!roomImage || !productImage) throw new Error("roomImage and productImage are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const placementText = placement
      ? `Place the ${productName} at the user-indicated spot: roughly ${placement.x}% from the left and ${placement.y}% from the top of the room photo.`
      : `Place the ${productName} in the most natural, visually balanced position in the room.`;

    const instruction = `You are given TWO images.
IMAGE 1 = the user's actual ROOM photo. KEEP this room IDENTICAL — do not change walls, floor, windows, lighting, camera angle, perspective, or existing objects. Do not crop or resize.
IMAGE 2 = the PRODUCT to insert: "${productName}". Preserve its exact color, material, shape and proportions as shown.
TASK: Realistically composite the product into the room photo. ${placementText}
Match the room's lighting direction, color temperature, and shadow softness. Add a soft contact shadow under the product. Scale the product to realistic real-world proportions relative to the room. Respect occlusion with existing objects. Output a single photoreal image of the room with the product placed in it.${notes ? " Extra notes: " + notes : ""}`;

    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: roomImage } },
              { type: "image_url", image_url: { url: productImage } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("place-in-room failed", response.status, t);
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("No image returned by AI");

    return new Response(JSON.stringify({ image: url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("place-in-room error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
