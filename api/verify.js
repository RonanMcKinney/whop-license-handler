export default async function handler(req, res) {
  const { license } = req.query;
  
  // Your paid product ID
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // Fetch all memberships (we need to search through them)
    const response = await fetch('https://api.whop.com/api/v2/memberships?per=100', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Whop API error:', response.status, response.statusText);
      return res.status(500).json({ 
        valid: false, 
        error: 'API error'
      });
    }
    
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      return res.status(500).json({ 
        valid: false, 
        error: 'Invalid API response'
      });
    }
    
    // CRITICAL: Search for EXACT license key match
    let foundMembership = null;
    
    for (const membership of result.data) {
      // MUST explicitly check license_key matches
      if (membership.license_key === license) {
        foundMembership = membership;
        break;
      }
    }
    
    // License not found
    if (!foundMembership) {
      console.log('License not found:', license);
      return res.status(200).json({ 
        valid: false, 
        status: 'not_found',
        message: 'License key not found'
      });
    }
    
    // CHECK 1: Must be paid product
    if (foundMembership.product !== PAID_PRODUCT_ID) {
      return res.status(200).json({
        valid: false,
        status: 'invalid_product',
        message: 'This license is for free product only. Please purchase paid version.'
      });
    }
    
    // CHECK 2: Must have valid status
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
    console.error('Validation error:', error.message);
    return res.status(500).json({ 
      valid: false, 
      error: 'Validation failed'
    });
  }
}
