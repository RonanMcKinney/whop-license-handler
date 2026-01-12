export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (!WHOP_API_KEY) {
    return res.status(500).json({ error: 'WHOP_API_KEY not configured' });
  }

  try {
    // Fetch memberships
    const response = await fetch('https://api.whop.com/api/v2/memberships?per=100', {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ 
        error: 'Failed to fetch memberships',
        details: errorText,
        status: response.status
      });
    }

    const result = await response.json();
    
    if (!result.data) {
      return res.status(500).json({ error: 'No data in response' });
    }

    // Filter for paid product
    const paidMemberships = result.data.filter(m => m.product === PAID_PRODUCT_ID);

    if (paidMemberships.length === 0) {
      return res.status(200).json({ 
        message: 'No paid memberships found',
        totalMemberships: result.data.length
      });
    }

    // Reset metadata
    const results = [];
    
    for (const membership of paidMemberships) {
      try {
        const patchResponse = await fetch(
          `https://api.whop.com/api/v2/memberships/${membership.id}`, 
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metadata: {} })
          }
        );

        results.push({
          license: membership.license_key,
          membershipId: membership.id,
          success: patchResponse.ok,
          status: patchResponse.status
        });

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        results.push({
          license: membership.license_key,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      message: 'Metadata reset completed',
      totalProcessed: paidMemberships.length,
      successful: successCount,
      failed: paidMemberships.length - successCount,
      results: results
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Fatal error',
      message: error.message,
      stack: error.stack
    });
  }
}
