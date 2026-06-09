export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  const prompt = `あなたは日本語の語彙教師です。成人向けの「頭が良さそうに見える」日本語の単語・フレーズを10個選んでください。漢語、四字熟語、和語、ビジネス敬語フレーズ、慣用表現をバランスよくミックスし、毎回必ず異なる単語を選んでください。必ず以下のJSON配列のみを返してください。説明もマークダウンも不要です。[{"word":"例","reading":"れい","tag":"漢語","meaning":"意味","example":"例文。","exampleEn":"Example."}]`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: 'Upstream error', detail: data });
    }
    const text = data.content.map(b => b.text || '').join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'No JSON found', raw: text.slice(0, 500) });
    }
    const words = JSON.parse(match[0]);
    res.status(200).json({ words });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
