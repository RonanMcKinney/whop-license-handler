export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhook = req.body;
    
    if (webhook.action === 'membership.went_valid') {
      const membership = webhook.data;
      const licenseKey = `WHP-${membership.id.substring(0, 8).toUpperCase()}`;
      
      const licenseData = JSON.stringify({
        status: 'active',
        productId: membership.product_id,
        membershipId: membership.id,
        userId: membership.user_id,
        activatedAt: new Date().toISOString()
      });
      
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/license:${licenseKey}/${encodeURIComponent(licenseData)}`, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      
      return res.status(200).json({ success: true, licenseKey });
    }
    
    if (webhook.action === 'membership.went_invalid') {
      const membership = webhook.data;
      const licenseKey = `WHP-${membership.id.substring(0, 8).toUpperCase()}`;
      
      const getResp = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/license:${licenseKey}`, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      
      const getData = await getResp.json();
      if (getData.result) {
        const licenseData = JSON.parse(getData.result);
        licenseData.status = 'inactive';
        licenseData.cancelledAt = new Date().toISOString();
        
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/license:${licenseKey}/${encodeURIComponent(JSON.stringify(licenseData))}`, {
          headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
        });
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
