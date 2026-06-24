module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://content.intentionalthrive.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { caption, imageUrl } = req.body || {};
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_TOKEN;

  if (!igUserId || !token) {
    return res.status(500).json({ error: 'Instagram credentials not configured. Add IG_USER_ID and IG_TOKEN to Vercel env.' });
  }
  if (!imageUrl?.trim()) {
    return res.status(400).json({ error: 'Instagram requires a public image URL (image_url field in your .md file).' });
  }

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v20.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
      }
    );
    const container = await containerRes.json();
    if (container.error) return res.status(400).json({ error: container.error.message });

    // Step 2: Publish container
    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: token }),
      }
    );
    const published = await publishRes.json();
    if (published.error) return res.status(400).json({ error: published.error.message });

    return res.status(200).json({ success: true, postId: published.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
