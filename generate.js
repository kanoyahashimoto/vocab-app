export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `あなたは日本語の語彙教師です。
成人向けの「頭が良さそうに見える」日本語の単語・フレーズを10個選んでください。

条件：
- 漢語（難しい熟語）、四字熟語、和語（古風な表現）、ビジネス敬語フレーズ、慣用表現をバランスよくミックス
- 毎回必ず異なる単語を選ぶ（被らないようにランダム性を高めること）
- 日常会話や文章で実際に使える実用的なもの

必ず以下のJSON形式のみで返してください。前置き・説明・マークダウンのコードブロックは一切不要です：
[
  {
    "word": "蓋然性",
    "reading": "がいぜんせい",
    "tag": "漢語",
    "meaning": "ある事柄が起こりうる確からしさ・可能性",
    "example": "彼の主張には蓋然性が低く、説得力に欠けた。",
    "exampleEn": "His claim had low probability and lacked persuasiveness."
  }
]
tagの値は「漢語」「四字熟語」「和語」「ビジネス」「表現」のいずれかにしてください。`;

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
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Upstream error', detail: err });
    }

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const words = JSON.parse(clean);

    res.status(200).json({ words });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
