// Quick test to verify Supabase connection and table access
const SUPABASE_URL = 'https://agxmrpvtyupazacjevtf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneG1ycHZ0eXVwYXphY2pldnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTczMjEsImV4cCI6MjA5MjA3MzMyMX0.rWuqzXXPB8ERsBWHSgScQzzfsvEhQjFwnbI85G9ft3E';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  
  // Test 1: Try to read from games table
  const readRes = await fetch(`${SUPABASE_URL}/rest/v1/games?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  console.log('\n--- READ TEST ---');
  console.log('Status:', readRes.status, readRes.statusText);
  const readBody = await readRes.text();
  console.log('Body:', readBody);

  // Test 2: Try to insert a test row
  const testId = 'TEST01';
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id: testId,
      player1_id: 'test_player',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'white',
      status: 'waiting',
      p1_timer: 600,
      p2_timer: 600,
      history: [],
      chat: [],
    })
  });
  console.log('\n--- INSERT TEST ---');
  console.log('Status:', insertRes.status, insertRes.statusText);
  const insertBody = await insertRes.text();
  console.log('Body:', insertBody);

  // Cleanup: delete test row
  if (insertRes.ok) {
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/games?id=eq.${testId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });
    console.log('\n--- CLEANUP ---');
    console.log('Delete status:', delRes.status);
  }
}

testConnection().catch(e => console.error('Fatal error:', e));
