import { Client } from 'pg';

export default async function handler(req, res) {
  // Reject non-POST cross-origin requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, track, details, answers } = req.body;

  // Validation guard check
  if (!email || !track) {
    return res.status(400).json({ 
      success: false, 
      error: 'Incomplete transaction payload: missing primary user parameters.' 
    });
  }

  // Use the injected Vercel environment variable with your direct hardcoded connection string fallback
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres.iuvyteyrhgatmqpbcmzl:IARIASC159637@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const formattedQuizResponses = typeof answers === 'object' ? JSON.stringify(answers) : (answers || '{}');
    const cleanedDetails = details ? details.trim() : null;
    const cleanedTrack = track.trim();

    // Upsert tracking query: writes new entries or updates existing records on key conflicts
    const queryText = `
      INSERT INTO labmatch_leads (email, chosen_track, contextual_details, quiz_responses, captured_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (email) 
      DO UPDATE SET 
        chosen_track = EXCLUDED.chosen_track,
        contextual_details = EXCLUDED.contextual_details,
        quiz_responses = EXCLUDED.quiz_responses,
        captured_at = CURRENT_TIMESTAMP;
    `;

    await client.query(queryText, [email.toLowerCase().trim(), cleanedTrack, cleanedDetails, formattedQuizResponses]);

    return res.status(200).json({ success: true, message: 'Lead recorded successfully in Supabase.' });

  } catch (error) {
    console.error('Database Operation Failure:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.end();
  }
}