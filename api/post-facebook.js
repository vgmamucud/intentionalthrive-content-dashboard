module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://content.intentionalthrive.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, pageTarget } = req.body || {};

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const configs = {
    'intentional-thrive': {
      pageId: process.env.FB_IT_PAGE_ID,
      token: process.env.FB_IT_TOKEN,
    },
    'life-ready': {
      pageId: process.env.FB_LIFE_READY_PAGE_ID,
      token: process.env.FB_LIFE_READY_TOKEN,
    },
  };

  const config = configs[pageTarget];
  if (!config?.pageId || !config?.token) {
    return res.status(500).json({ error: `Facebook credentials not configured for: ${pageTarget}` });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${config.pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: config.token }),
      }
    );
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ success: true, postId: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
