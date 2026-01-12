export default async function handler(req, res) {
  const { license } = req.query;
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // Fetch all memberships with pagination
    let allMemberships = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) { // Max 5 pages = 500 memberships
      const response = await fetch(
        `https://api.whop.com/v2/memberships?product_ids=${PAID_PRODUCT_ID}&per=100&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return res.status(500).json({ valid: false, error: 'API error' });
      }
      
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        allMemberships = allMemberships.concat(result.data);
        
        if (result.pagination && result.pagination.current_page < result.pagination.total_pages) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    // Find matching license
    const foundMembership = allMemberships.find(m => m.license_key === license);
    
    if (!foundMembership) {
      return res.status(200).json({ 
        valid: false, 
        status: 'not_found',
        message: 'License key not found'
      });
    }
    
    // Check if paid product
    if (foundMembership.product !== PAID_PRODUCT_ID) {
      return res.status(200).json({
        valid: false,
        status: 'invalid_product',
        message: 'This license is for free product only. Please purchase paid version.'
      });
    }
    
    // Check valid status
    const isValid = foundMembership.valid === true && 
                   (foundMembership.status === 'completed' || 
                    foundMembership.status === 'active' ||
                    foundMembership.status === 'trialing');
    
    return res.status(200).json({
      valid: isValid,
      status: foundMembership.status,
      userId: foundMembership.user,
      productId: foundMembership.product,
      expiresAt: foundMembership.expires_at,
      membershipId: foundMembership.id,
      email: foundMembership.email
    });
    
  } catch (error) {
    return res.status(500).json({ 
      valid: false, 
      error: 'Validation failed'
    });
  }
}
