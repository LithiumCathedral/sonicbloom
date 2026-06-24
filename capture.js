export default async function handler(req, res) {
  // Enforce CORS security protocols
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, track, workMode } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email signature required.' });
  }

  try {
    // Connect your chosen database or CRM API endpoint here
    const databaseEndpoint = process.env.DATABASE_TARGET_URL;
    const apiKey = process.env.DATABASE_API_KEY;

    const response = await fetch(databaseEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Email: email,
          TrackAssignment: track,
          AllocationMode: workMode,
          Timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) throw new Error('Database write failure');

    return res.status(200).json({ status: 'SUCCESS_AUTHENTICATED' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal pipeline optimization fault.' });
  }
}