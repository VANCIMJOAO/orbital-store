const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let url = '', key = '';
lines.forEach(l => {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=').slice(1).join('=').trim();
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = l.split('=').slice(1).join('=').trim();
});
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };

async function go() {
  // All matches
  const r = await fetch(url + '/rest/v1/matches?select=id,round,status,team1_id,team2_id,team1_score,team2_score,winner_id&order=scheduled_at', { headers });
  const ms = await r.json();

  if (!Array.isArray(ms)) {
    console.log('ERROR:', JSON.stringify(ms));
    return;
  }

  // Collect team IDs
  const tids = new Set();
  ms.forEach(m => {
    if (m.team1_id) tids.add(m.team1_id);
    if (m.team2_id) tids.add(m.team2_id);
    if (m.winner_id) tids.add(m.winner_id);
  });

  // Get team names
  const tr = await fetch(url + '/rest/v1/teams?id=in.(' + Array.from(tids).join(',') + ')&select=id,tag,name', { headers });
  const ts = await tr.json();
  const tm = {};
  ts.forEach(t => tm[t.id] = t.tag || t.name);

  console.log('=== BRACKET STATE (' + ms.length + ' matches) ===');
  console.log('Round'.padEnd(22) + 'Status'.padEnd(12) + 'Team1'.padEnd(15) + 'Score'.padEnd(8) + 'Team2'.padEnd(15) + 'Winner');
  console.log('-'.repeat(85));

  ms.forEach(m => {
    const t1 = m.team1_id ? (tm[m.team1_id] || '?') : 'TBD';
    const t2 = m.team2_id ? (tm[m.team2_id] || '?') : 'TBD';
    const score = m.team1_score + '-' + m.team2_score;
    const w = m.winner_id ? (tm[m.winner_id] || '?') : '-';
    console.log(
      (m.round || '?').padEnd(22) +
      m.status.padEnd(12) +
      t1.padEnd(15) +
      score.padEnd(8) +
      t2.padEnd(15) +
      w
    );
  });

  // Check specific bracket advance
  console.log('\n=== BRACKET ADVANCE VERIFICATION ===');
  const fluxoMatch = ms.find(m => m.round === 'winner_quarter_1');
  if (fluxoMatch) {
    console.log('winner_quarter_1: ' + (tm[fluxoMatch.winner_id] || 'no winner') + ' won');

    const semi1 = ms.find(m => m.round === 'winner_semi_1');
    if (semi1) {
      console.log('winner_semi_1: team1=' + (semi1.team1_id ? tm[semi1.team1_id] : 'TBD') + ', team2=' + (semi1.team2_id ? tm[semi1.team2_id] : 'TBD') + ', status=' + semi1.status);
    }

    const loser1 = ms.find(m => m.round === 'loser_round1_1');
    if (loser1) {
      console.log('loser_round1_1: team1=' + (loser1.team1_id ? tm[loser1.team1_id] : 'TBD') + ', team2=' + (loser1.team2_id ? tm[loser1.team2_id] : 'TBD') + ', status=' + loser1.status);
    }
  }

  // Check which matches should be "scheduled" (both teams set)
  console.log('\n=== MATCHES READY BUT NOT SCHEDULED ===');
  ms.forEach(m => {
    if (m.team1_id && m.team2_id && m.status === 'pending') {
      console.log('WARNING: ' + m.round + ' has both teams but status is "pending" (should be "scheduled")');
    }
  });
}

go().catch(e => console.error('Error:', e));
