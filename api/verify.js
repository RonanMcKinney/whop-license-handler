export default async function handler(req, res) {
  const { license } = req.query;
  
  const PAID_PRODUCT_ID = 'prod_1vgh0MwjNAYGN';
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // NEW: Search for specific license key
    const response = await fetch(
      `https://api.whop.com/api/v2/memberships?license_key=${encodeURIComponent(license)}&per=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Whop API error:', response.status, response.statusText);
      return res.status(500).json({ valid: false, error: 'API error' });
    }
    
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return res.status(200).json({ 
        valid: false, 
        status: 'not_found',
        message: 'License key not found. Please reset your license metadata at whop.com/hub if this is an older key.'
      });
    }
    
    const membership = result.data[0];
    
    // CHECK 1: Must be paid product
    if (membership.product !== PAID_PRODUCT_ID) {
      return res.status(200).json({
        valid: false,
        status: 'invalid_product',
        message: 'This license is for free product only. Please purchase paid version.'
      });
    }
    
    // CHECK 2: Must have valid status
    const isValid = membership.valid === true && 
                   (membership.status === 'completed' || 
                    membership.status === 'active' ||
                    membership.status === 'trialing');
    
    return res.status(200).json({
      valid: isValid,
      status: membership.status,
      userId: membership.user,
      productId: membership.product,
      expiresAt: membership.expires_at,
      membershipId: membership.id,
      email: membership.email
    });
    
  } catch (error) {
    console.error('Validation error:', error.message);
    return res.status(500).json({ valid: false, error: 'Validation failed' });
  }
}
