export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY; // Already in Vercel - don't hardcode

  if (!WHOP_API_KEY) {
    return res.status(500).json({ error: 'WHOP_API_KEY not configured' });
  }

  try {
    // Fetch ALL memberships with pagination
    let allMemberships = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.whop.com/v2/memberships?product_ids=${PRODUCT_ID}&per=100&page=${page}`,
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
      
      if (result.data && result.data.length > 0) {
        allMemberships = allMemberships.concat(result.data);
        
        // Check if there are more pages
        if (result.pagination && result.pagination.current_page < result.pagination.total_pages) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (allMemberships.length === 0) {
      return res.status(200).json({ 
        message: 'No memberships found',
        productId: PRODUCT_ID
      });
    }

    // Try to reset metadata for each
    const results = [];
    
    for (const membership of allMemberships) {
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
          membershipId: membership.id,
          license: membership.license_key,
          success: patchResponse.ok,
          status: patchResponse.status,
          response: patchResponse.ok ? 'SUCCESS' : responseData
        });

        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        results.push({
          membershipId: membership.id,
          license: membership.license_key,
          success: false,
          error: err.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;

    return res.status(200).json({
      message: successful > 0 ? '🎉 Metadata reset successful!' : 'All updates failed - API key permission issue',
      totalFound: allMemberships.length,
      totalProcessed: results.length,
      successful: successful,
      failed: results.length - successful,
      results: results,
      note: successful === 0 
        ? 'WHOP API IS BLOCKING UPDATES. Contact Whop support: "My Company API key (with member:manage + member:basic:read) gets 401 on PATCH /v2/memberships/{id}. Please either fix the API key permissions OR bulk reset metadata for product prod_1vgh0MwjNAYGN on your end."'
        : undefined
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Fatal error',
      message: error.message
    });
  }
}
