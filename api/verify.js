export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const { license } = req.query;
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // Search through ALL pages to find the license
    let page = 1;
    let foundMembership = null;
    
    while (page <= 60 && !foundMembership) { // Max 60 pages based on your data
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
        // Search this page for the license
        foundMembership = result.data.find(m => m.license_key === license);
        
        if (!foundMembership && result.pagination && page < result.pagination.total_page) {
          page++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    if (!foundMembership) {
      return res.status(200).json({ 
        valid: false, 
        status: 'not_found',
        message: 'License key not found in paid product memberships'
      });
    }
    
    // Check if valid
    const isValid = foundMembership.valid === true && 
                   (foundMembership.status === 'active' || 
                    foundMembership.status === 'completed' ||
                    foundMembership.status === 'trialing');
    
    return res.status(200).json({
      valid: isValid,
      status: foundMembership.status,
      userId: foundMembership.user,
      productId: foundMembership.product,
      expiresAt: foundMembership.expires_at,
      email: foundMembership.email,
      foundOnPage: page
    });
    
  } catch (error) {
    return res.status(200).json({ 
      valid: false, 
      error: 'Validation failed',
      details: error.message
    });
  }
}
