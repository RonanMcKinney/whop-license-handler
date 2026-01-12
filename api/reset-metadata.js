export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (!WHOP_API_KEY) {
    return res.status(500).json({ error: 'WHOP_API_KEY not configured' });
  }

  try {
    // Step 1: Fetch memberships - CORRECT URL (no /api)
    const response = await fetch(
      `https://api.whop.com/v2/memberships?product_ids=${PAID_PRODUCT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ 
        error: 'Failed to fetch memberships',
        status: response.status,
        details: errorText
      });
    }

    const result = await response.json();
    
    if (!result.data || result.data.length === 0) {
      return res.status(200).json({ 
        message: 'No memberships found for this product',
        productId: PAID_PRODUCT_ID
      });
    }

    // Step 2: Reset metadata - CORRECT URL (no /api)
    const results = [];
    
    for (const membership of result.data) {
      try {
        const patchResponse = await fetch(
          `https://api.whop.com/v2/memberships/${membership.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metadata: {} })
          }
        );

        const responseText = await patchResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        results.push({
          license: membership.license_key,
          membershipId: membership.id,
          success: patchResponse.ok,
          status: patchResponse.status,
          response: patchResponse.ok ? 'SUCCESS' : responseData
        });

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        results.push({
          license: membership.license_key,
          membershipId: membership.id,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      message: successCount > 0 ? '🎉 Metadata reset successful!' : 'All updates failed',
      totalProcessed: result.data.length,
      successful: successCount,
      failed: result.data.length - successCount,
      results: results
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Fatal error',
      message: error.message
    });
  }
}
