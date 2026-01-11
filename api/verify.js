export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    console.log('Checking license:', license);
    
    // Try method 1: List all memberships and find by license_key
    const response = await fetch('https://api.whop.com/api/v5/memberships', {
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
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('Whop API response:', JSON.stringify(data, null, 2));
    
    // Search through memberships for matching license key
    if (data.data && Array.isArray(data.data)) {
      for (const membership of data.data) {
        console.log('Checking membership:', membership.id, 'License:', membership.license_key);
        
        if (membership.license_key === license) {
          const isValid = membership.status === 'active' || membership.valid === true;
          
          return res.status(200).json({
            valid: isValid,
            status: membership.status,
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
      debug: {
        totalMemberships: data.data?.length || 0,
        searchedLicense: license
      }
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
