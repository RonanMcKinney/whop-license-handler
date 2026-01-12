export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const PRODUCT_ID = "prod_1vgh0MwjNAYGN";
  const WHOP_API_KEY = process.env.WHOP_API_KEY; // MUST be the APP API key

  if (!WHOP_API_KEY) {
    return res.status(500).json({ error: "WHOP_API_KEY not configured" });
  }

  try {
    // 1) List memberships for product
    const listResp = await fetch(
      `https://api.whop.com/api/v2/memberships?product_ids=${encodeURIComponent(PRODUCT_ID)}`,
      {
        headers: {
          Authorization: `Bearer ${WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const listText = await listResp.text();
    let listJson;
    try { listJson = JSON.parse(listText); } catch { listJson = null; }

    if (!listResp.ok) {
      return res.status(listResp.status).json({
        error: "Failed to list memberships",
        status: listResp.status,
        response: listJson ?? listText,
      });
    }

    const memberships = Array.isArray(listJson?.data) ? listJson.data : [];
    if (memberships.length === 0) {
      return res.status(200).json({ message: "No memberships found", productId: PRODUCT_ID });
    }

    // 2) Patch each membership metadata -> {}
    const results = [];
    for (const m of memberships) {
      const updResp = await fetch(`https://api.whop.com/api/v2/memberships/${m.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata: {} }),
      });

      const updText = await updResp.text();
      let updJson;
      try { updJson = JSON.parse(updText); } catch { updJson = null; }

      results.push({
        membershipId: m.id,
        license: m.license_key,
        success: updResp.ok,
        status: updResp.status,
        response: updJson ?? updText,
      });

      await new Promise((r) => setTimeout(r, 250));
    }

    const successful = results.filter((r) => r.success).length;
    return res.status(200).json({
      message: successful > 0 ? "Metadata reset completed" : "All updates failed",
      totalProcessed: results.length,
      successful,
      failed: results.length - successful,
      results,
    });
  } catch (e) {
    return res.status(500).json({ error: "Fatal error", message: e.message });
  }
}
