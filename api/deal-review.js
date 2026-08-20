export default async function handler(req, res) {
  try {
    const dealQuery = (req.query.deal || '').toLowerCase();
    if (!dealQuery) {
      return res.status(400).json({ error: 'Missing deal name. Use ?deal=acme' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO; // e.g. "khoslarhea-hub/revopscourse"

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

    const match = files.find(f => f.name.toLowerCase().includes(dealQuery));
    if (!match) {
      return res.status(404).json({ error: `No deal file matching "${dealQuery}" found in deals/` });
    }

    // 2. Fetch the matched deal file content
    const dealRes = await fetch(match.download_url);
    const dealText = await dealRes.text();

    // 3. Fetch the skill instructions
    const skillRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/.claude/skills/deal-quality/SKILL.md`,
      { headers: ghHeaders }
    );
    const skillJson = await skillRes.json();
    const skillText = Buffer.from(skillJson.content, 'base64').toString('utf-8');

    // 4. Call Claude API
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

    return res.status(200).json({ file: match.name, review });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
