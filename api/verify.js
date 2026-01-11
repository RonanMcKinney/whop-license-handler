export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    console.log('Checking license:', license);
    
    // Check Whop API for membership validity by license key
    const whopUrl = `https://api.whop.com/api/v5/memberships?license_key=${license}`;
    console.log('Whop API URL:', whopUrl);
    
    const response = await fetch(whopUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Whop API status:', response.status);
    
    const data = await response.json();
    console.log('Whop API response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      const membership = data.data[0];
      
      // Check if membership is active
      if (membership.status === 'active' || membership.valid === true) {
        return res.status(200).json({
          valid: true,
          status: 'active',
          userId: membership.user?.id,
          productId: membership.product?.id,
          expiresAt: membership.expires_at
        });
      }
    }
    
    // Return the full response for debugging
    return res.status(200).json({ 
      valid: false, 
      status: 'inactive',
      debug: data 
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
