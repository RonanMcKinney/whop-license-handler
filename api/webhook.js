export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhook = req.body;
    
    // LOG EVERYTHING
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Full webhook data:', JSON.stringify(webhook, null, 2));
    console.log('Action:', webhook.action);
    console.log('========================');
    
    if (webhook.action === 'membership.activated' || webhook.action === 'membership.went_valid') {
      const membership = webhook.data;
      console.log('Membership data:', membership);
      
      const licenseKey = `WHP-${membership.id.substring(0, 8).toUpperCase()}`;
      console.log('Generated license key:', licenseKey);
      
      const licenseData = JSON.stringify({
        status: 'active',
        productId: membership.product_id,
        membershipId: membership.id,
        userId: membership.user_id,
        activatedAt: new Date().toISOString()
      });
      
      console.log('Storing license data:', licenseData);
      
      const upstashUrl = `${process.env.UPSTASH_REDIS_REST_URL}/set/license:${licenseKey}/${encodeURIComponent(licenseData)}`;
      console.log('Upstash URL:', upstashUrl);
      
      const response = await fetch(upstashUrl, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      
      console.log('Upstash response status:', response.status);
      const responseData = await response.json();
      console.log('Upstash response:', responseData);
      
      return res.status(200).json({ success: true, licenseKey });
    }
    
    return res.status(200).json({ received: true, action: webhook.action });
    
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
