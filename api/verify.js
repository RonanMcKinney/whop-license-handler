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

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // DIAGNOSTIC: Show everything
    return res.status(200).json({
      diagnostic: true,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      responseBody: responseData,
      requestUrl: `https://api.whop.com/api/v2/memberships/${license}/validate_license`,
      apiKeyPrefix: WHOP_API_KEY.substring(0, 10) + '...',
      note: 'This shows raw API response for debugging'
    });
    
  } catch (error) {
    return res.status(200).json({ 
      valid: false,
      status: 'error',
      message: 'Validation error',
      errorDetails: error.message
    });
  }
}
