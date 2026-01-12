javascript
// api/reset-metadata.js
export default async function handler(req, res) {
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET request.' });
  }

  try {
    // Step 1: Fetch all memberships
    const response = await fetch('https://api.whop.com/api/v2/memberships?per=100', {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${response.status}` });
    }

    const result = await response.json();
    
    // Step 2: Filter for paid product
    const paidMemberships = result.data.filter(m => m.product === PAID_PRODUCT_ID);

    if (paidMemberships.length === 0) {
      return res.status(200).json({ message: 'No paid memberships found.' });
    }

    // Step 3: Reset metadata for each
    let successCount = 0;
    let details = [];

    for (const membership of paidMemberships) {
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

      if (patchResponse.ok) {
        details.push({ license: membership.license_key, status: 'SUCCESS' });
        successCount++;
      } else {
        details.push({ license: membership.license_key, status: 'FAILED' });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalProcessed: paidMemberships.length,
        successful: successCount
      },
      details: details,
      message: '🎉 Metadata reset complete!',
      testUrls: paidMemberships.slice(0, 3).map(m => 
        `https://whop-license-handler.vercel.app/api/verify?license=${m.license_key}`
      )
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
