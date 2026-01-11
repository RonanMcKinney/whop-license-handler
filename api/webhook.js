export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhook = req.body;
    const eventType = webhook.type;
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Event type:', eventType);
    
    if (eventType === 'membership.activated' || eventType === 'membership.went_valid') {
      const membership = webhook.data;
      const licenseKey = `WHP-${membership.id.substring(4, 12).toUpperCase()}`;
      
      console.log('Membership ID:', membership.id);
      console.log('Generated license key:', licenseKey);
      
      // Store in Upstash
      const licenseData = JSON.stringify({
        status: 'active',
        productId: membership.product.id,
        membershipId: membership.id,
        userId: membership.user.id,
        username: membership.user.username,
        activatedAt: new Date().toISOString()
      });
      
      console.log('Storing in Upstash...');
      
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/license:${licenseKey}/${encodeURIComponent(licenseData)}`, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      
      console.log('✓ License stored successfully in Upstash');
      
      return res.status(200).json({ success: true, licenseKey });
    }
    
    if (eventType === 'membership.cancelled' || eventType === 'membership.went_invalid') {
      const membership = webhook.data;
      const licenseKey = `WHP-${membership.id.substring(4, 12).toUpperCase()}`;
      
      console.log('Deactivating license:', licenseKey);
      
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
        
        console.log('✓ License deactivated');
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(200).json({ received: true, type: eventType });
    
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
