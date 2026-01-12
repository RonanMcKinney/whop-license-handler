export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const { license } = req.query;
  const WHOP_API_KEY = process.env.WHOP_API_KEY;

  if (!license) {
    return res.status(400).json({ 
      valid: false, 
      error: 'License key required' 
    });
  }

  if (!WHOP_API_KEY) {
    return res.status(500).json({ 
      valid: false, 
      error: 'API key not configured' 
    });
  }

  try {
    // Use Whop's dedicated license validation endpoint
    const response = await fetch(
      `https://api.whop.com/api/v2/memberships/${encodeURIComponent(license)}/validate_license`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // License not found or invalid
      if (response.status === 404) {
        return res.status(200).json({
          valid: false,
          status: 'not_found',
          message: 'License key not found'
        });
      }
      
      // Other API errors
      return res.status(200).json({
        valid: false,
        status: 'error',
        message: 'Validation failed'
      });
    }

    const membership = await response.json();
    
    // Check if membership is valid and active
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
      email: membership.email,
      licenseKey: membership.license_key
    });
    
  } catch (error) {
    return res.status(200).json({ 
      valid: false,
      status: 'error',
      message: 'Validation error'
    });
  }
}
