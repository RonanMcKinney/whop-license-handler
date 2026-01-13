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
    
    while (page <= 60 && !foundMembership) {
      const response = await fetch(
        `https://api.whop.com/v2/memberships?per=100&page=${page}`,
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
        // Search this page for the license WITH paid product check
        foundMembership = result.data.find(m => 
          m.license_key === license && 
          m.product === PAID_PRODUCT_ID  // ← CRITICAL CHECK!
        );
        
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
        message: 'License key not found or not for paid product'
      });
    }
    
    // Additional product validation (double-check)
    if (foundMembership.product !== PAID_PRODUCT_ID) {
      return res.status(200).json({
        valid: false,
        status: 'wrong_product',
        message: 'This license is for free product only. Purchase paid version.',
        actualProduct: foundMembership.product
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
      email: foundMembership.email
    });
    
  } catch (error) {
    return res.status(200).json({ 
      valid: false, 
      error: 'Validation failed'
    });
  }
}
