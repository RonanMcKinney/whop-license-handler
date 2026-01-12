export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const { license } = req.query;
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // Fetch all paid memberships with pagination
    let allMemberships = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Max 10 pages = 1000 members
      const response = await fetch(
        `https://api.whop.com/v2/memberships?product_ids=${PAID_PRODUCT_ID}&per=100&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return res.status(200).json({ valid: false, error: 'API error' });
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
    const membership = allMemberships.find(m => m.license_key === license);
    
    if (!membership) {
      return res.status(200).json({ 
        valid: false, 
        status: 'not_found'
      });
    }
    
    // Check if valid
    const isValid = membership.valid === true && 
                   (membership.status === 'active' || 
                    membership.status === 'completed' ||
                    membership.status === 'trialing');
    
    return res.status(200).json({
      valid: isValid,
      status: membership.status,
      userId: membership.user,
      productId: membership.product,
      expiresAt: membership.expires_at,
      email: membership.email
    });
    
  } catch (error) {
    return res.status(200).json({ valid: false, error: 'Validation failed' });
  }
}
