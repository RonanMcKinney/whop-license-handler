export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const { license } = req.query;
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;
  const TARGET_LICENSE = 'F-E3B385-3C025E1D-A6D5C7W';

  try {
    // Fetch first page of paid memberships
    const response = await fetch(
      `https://api.whop.com/v2/memberships?product_ids=${PAID_PRODUCT_ID}&per=100&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return res.status(200).json({ 
        error: 'API call failed',
        status: response.status
      });
    }
    
    const result = await response.json();
    
    // Find the target license
    const targetMembership = result.data?.find(m => m.license_key === TARGET_LICENSE);
    
    // Get sample of license keys
    const sampleKeys = result.data?.slice(0, 10).map(m => ({
      license: m.license_key,
      status: m.status,
      valid: m.valid,
      product: m.product
    }));

    return res.status(200).json({
      diagnostic: true,
      totalFound: result.data?.length || 0,
      pagination: result.pagination,
      targetLicenseFound: !!targetMembership,
      targetLicenseData: targetMembership || 'NOT FOUND',
      sampleLicenses: sampleKeys,
      queryUsed: `product_ids=${PAID_PRODUCT_ID}`,
      note: 'Shows what memberships API is actually returning'
    });
    
  } catch (error) {
    return res.status(200).json({ 
      error: error.message
    });
  }
}
