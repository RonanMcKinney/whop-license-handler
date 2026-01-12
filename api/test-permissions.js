export default async function handler(req, res) {
  const WHOP_API_KEY = process.env.WHOP_API_KEY;
  
  try {
    const testRead = await fetch('https://api.whop.com/api/v2/memberships?per=1', {
      headers: { 'Authorization': `Bearer ${WHOP_API_KEY}` }
    });
    
    const canRead = testRead.ok;
    let canUpdate = false;
    
    if (canRead) {
      const memberships = await testRead.json();
      if (memberships.data[0]) {
        const testUpdate = await fetch(
          `https://api.whop.com/api/v2/memberships/${memberships.data[0].id}`,
          {
            method: 'PATCH',
            headers: { 
              'Authorization': `Bearer ${WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metadata: {} })
          }
        );
        canUpdate = testUpdate.ok;
      }
    }
    
    return res.json({
      canRead,
      canUpdate,
      message: canUpdate ? '✅ API key works!' : '❌ Still wrong permissions'
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
}
