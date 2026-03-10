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

  const imgRes = await fetch(imageUrl)
  const imgBuffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(imgBuffer).toString('base64')
  const mediaType = imgRes.headers.get('content-type') || 'image/jpeg'

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
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Analyse this outfit photo and return ONLY raw JSON with no markdown backticks:\n{"tags":["array","of","tags"],"season":"spring/summer/autumn/winter","occasion":"casual/work/evening/formal/weekend","vibe":"one or two word style description"}\nTags should include garment types, colours, patterns, materials, and style descriptors.' }
        ]
      }]
    })
  })

  const data = await response.json()
  if (!data.content || !data.content[0]) {
    return res.status(200).json({ tags: [] })
  }
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  try {
    res.status(200).json(JSON.parse(clean))
  } catch(e) {
    res.status(200).json({ tags: [] })
  }
}

