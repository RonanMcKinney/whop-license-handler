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
    console.log('Raw response:', JSON.stringify(data, null, 2));
    
    // Return the raw data so we can see the structure
    return res.status(200).json({ 
      valid: false, 
      debug: true,
      rawResponse: data,
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
