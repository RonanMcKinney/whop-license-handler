export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    const response = await fetch('https://api.whop.com/api/v2/memberships', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ 
        valid: false, 
        error: 'API error'
      });
    }
    
    const result = await response.json();
    
    // Check if data exists and is an array
    if (!result.data || !Array.isArray(result.data)) {
      return res.status(500).json({ 
        valid: false, 
        error: 'Invalid API response'
      });
    }
    
    // Search for matching license key
    for (const membership of result.data) {
      if (membership.license_key === license) {
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
      }
    }
    
    // License not found
    return res.status(200).json({ 
      valid: false, 
      status: 'not_found',
      message: 'License key not found'
    });
    
  } catch (error) {
    console.error('Validation error:', error.message);
    return res.status(500).json({ 
      valid: false, 
      error: 'Validation failed'
    });
  }
}
