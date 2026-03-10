export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') return res.status(405).end()

  res.setHeader('Access-Control-Allow-Origin', '*')

  const { imageUrl } = req.body

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: 'Analyse this outfit photo and return ONLY a JSON object with no markdown:\n{"tags":["array","of","tags"],"season":"spring/summer/autumn/winter","occasion":"casual/work/evening/formal/weekend","vibe":"one or two word style description"}\nTags should include garment types, colours, patterns, materials, and style descriptors. Return only raw JSON, no backticks, no explanation.' }
        ]
      }]
    })
  })

  const data = await response.json()
  if (!data.content || !data.content[0]) {
    return res.status(500).json({ tags: [], error: 'AI error' })
  }
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  try {
    res.status(200).json(JSON.parse(clean))
  } catch(e) {
    res.status(200).json({ tags: [] })
  }
}
