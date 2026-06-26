import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing email parameter.' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Isolated test query: Target ONLY the email column to check connection validity
    const queryText = `
      INSERT INTO labmatch_leads (email) 
      VALUES ($1)
      ON CONFLICT (email) 
      DO UPDATE SET email = EXCLUDED.email;
    `;

    await client.query(queryText, [email.toLowerCase().trim()]);
    return res.status(200).json({ success: true, message: 'Connection verified. Email captured.' });

  } catch (error) {
    console.error('Database Operation Failure:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.end();
  }
}