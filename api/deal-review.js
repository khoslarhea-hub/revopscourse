export default async function handler(req, res) {
  try {
    const message = (req.query.text || req.body?.text || '').toLowerCase();
    if (!message) {
      return res.status(400).json({ error: 'Missing message text. Use ?text=review the acme deal' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO;
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    };

    // 1. List files in deals/
    const listRes = await fetch(`https://api.github.com/repos/${REPO}/contents/deals`, { headers: ghHeaders });
    if (!listRes.ok) {
      return res.status(500).json({ error: `Could not list deals folder: ${listRes.status}` });
    }
    const files = await listRes.json();

    // 2. Score each file by how many of its name-words appear in the message
    const stopWords = new Set(['deal', 'pricing', 'the', 'md', 'txt', 'pdf', 'xlsx']);
    let bestMatch = null;
    let bestScore = 0;

    for (const file of files) {
      const nameWords = file.name
        .toLowerCase()
        .replace(/\.(md|txt|pdf|xlsx)$/, '')
        .split(/[-_\s]+/)
        .filter(w => w.length >= 3 && !stopWords.has(w));

      const score = nameWords.filter(w => message.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = file;
      }
    }

    if (!bestMatch || bestScore === 0) {
      return res.status(404).json({
        error: `Could not confidently match a deal to: "${message}"`,
        availableDeals: files.map(f => f.name),
      });
    }

    // 3. Fetch the matched deal file content
    const dealRes = await fetch(bestMatch.download_url);
    const dealText = await dealRes.text();

    // 4. Fetch the skill instructions
    const skillRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/.claude/skills/deal-quality/SKILL.md`,
      { headers: ghHeaders }
    );
    const skillJson = await skillRes.json();
    const skillText = Buffer.from(skillJson.content, 'base64').toString('utf-8');

    // 5. Call Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: skillText,
        messages: [
          { role: 'user', content: `Review this deal desk pricing document:\n\n${dealText}` }
        ],
      }),
    });

    const claudeJson = await claudeRes.json();
    const review = claudeJson.content?.[0]?.text || 'No response generated.';

    return res.status(200).json({ matchedFile: bestMatch.name, matchConfidence: bestScore, review });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
