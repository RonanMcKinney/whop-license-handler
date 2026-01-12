export default async function handler(req, res) {
  const WHOP_API_KEY = process.env.WHOP_API_KEY;
  
  try {
    // Fetch memberships
    const response = await fetch('https://api.whop.com/api/v2/memberships?per=1', {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const memberships = await response.json();
    
    if (!memberships.data || memberships.data.length === 0) {
      return res.json({ error: 'No memberships found' });
    }

    const testMembership = memberships.data[0];

    // Try to update it
    const updateResponse = await fetch(
      `https://api.whop.com/api/v2/memberships/${testMembership.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metadata: {} })
      }
    );

    const updateBody = await updateResponse.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(updateBody);
    } catch {
      parsedBody = updateBody;
    }

    return res.json({
      membershipId: testMembership.id,
      company: testMembership.company,
      updateStatus: updateResponse.status,
      updateStatusText: updateResponse.statusText,
      updateResponse: parsedBody,
      apiKeyPrefix: WHOP_API_KEY.substring(0, 15) + '...',
      diagnosis: updateResponse.status === 401 
        ? 'API key lacks permission OR belongs to different Whop company'
        : updateResponse.status === 200 
        ? 'SUCCESS!'
        : 'Unknown error'
    });

  } catch (error) {
    return res.json({ error: error.message, stack: error.stack });
  }
}
