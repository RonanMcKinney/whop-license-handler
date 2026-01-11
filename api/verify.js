export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    console.log('Checking license:', license);
    
    // Use v2 API which works with Company API keys
    const response = await fetch('https://api.whop.com/api/v2/memberships', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Whop API status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Whop API error:', errorText);
      return res.status(200).json({ 
        valid: false, 
        error: 'API error',
        status: response.status,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('Found memberships:', data.length);
    
    // Search through memberships for matching license key
    if (Array.isArray(data)) {
      for (const membership of data) {
        console.log('Checking membership:', membership.id, 'License:', membership.license_key);
        
        if (membership.license_key === license) {
          const isValid = membership.valid === true;
          
          return res.status(200).json({
            valid: isValid,
            status: isValid ? 'active' : 'inactive',
            userId: membership.user?.id,
            productId: membership.product?.id,
            expiresAt: membership.expires_at,
            membershipId: membership.id
          });
        }
      }
    }
    
    return res.status(200).json({ 
      valid: false, 
      status: 'not_found',
      message: 'License key not found',
      searchedLicense: license
    });
    
  } catch (error) {
    console.error('Validation error:', error.message);
    return res.status(500).json({ 
      valid: false, 
      error: 'Validation failed',
      details: error.message 
    });
  }
}
