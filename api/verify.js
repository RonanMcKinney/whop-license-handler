export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    console.log('Checking license:', license);
    
    const response = await fetch('https://api.whop.com/api/v2/memberships', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Whop API status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({ 
        valid: false, 
        error: 'API error',
        status: response.status,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('Memberships found:', data.length);
    
    // DEBUG: Show all license keys found
    const allLicenseKeys = data.map(m => ({
      membershipId: m.id,
      licenseKey: m.license_key,
      status: m.valid ? 'active' : 'inactive'
    }));
    
    console.log('All license keys:', JSON.stringify(allLicenseKeys, null, 2));
    
    // Search for matching license key
    if (Array.isArray(data)) {
      for (const membership of data) {
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
    
    // Return debug info
    return res.status(200).json({ 
      valid: false, 
      status: 'not_found',
      message: 'License key not found',
      searchedLicense: license,
      availableLicenses: allLicenseKeys
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
