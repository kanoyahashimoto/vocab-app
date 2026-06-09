export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('API key exists:', !!apiKey);
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: 'Return this exact JSON and nothing else: [{"word":"test","reading":"テスト","tag":"漢語","meaning":"テスト","example":"テストです。","exampleEn":"This is a test."}]' }],
      }),
    });

    console.log('Anthropic status:', response.status);
    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data).slice(0, 200));

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
    console.log('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
