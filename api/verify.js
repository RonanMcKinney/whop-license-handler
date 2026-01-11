export default async function handler(req, res) {
  const { license } = req.query;
  
  if (!license) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    // Check Whop API for membership validity by license key
    const response = await fetch(`https://api.whop.com/api/v5/memberships?license_key=${license}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const membership = data.data[0];
      
      // Check if membership is active
      if (membership.status === 'active' || membership.valid === true) {
        return res.status(200).json({
          valid: true,
          status: 'active',
          userId: membership.user.id,
          productId: membership.product.id,
          expiresAt: membership.expires_at
        });
      }
    }
    
    return res.status(200).json({ valid: false, status: 'inactive' });
    
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ valid: false, error: 'Validation failed' });
  }
}
