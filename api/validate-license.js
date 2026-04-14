// api/validate-license.js - Vercel serverless function for Lemon Squeezy license validation
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { licenseKey, instanceName } = req.body;

    if (!licenseKey) {
      res.status(400).json({ error: 'License key is required' });
      return;
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_name: instanceName || 'NicheKit'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error || 'License validation failed' });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error validating license:', error);
    res.status(500).json({ error: error.message });
  }
};
