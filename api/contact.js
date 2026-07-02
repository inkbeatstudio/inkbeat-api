export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { name, email, message, honeypot } = req.body
  if (honeypot) return res.json({ success: true })
  if (!name || !email || !message) return res.status(400).json({ error: 'Заповніть всі поля' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Невірний email' })
  if (message.length < 10) return res.status(400).json({ error: 'Повідомлення занадто коротке' })

  console.log('Contact:', { name, email, message })
  res.json({ success: true, message: 'Повідомлення надіслано! Відповімо протягом 24 годин.' })
}
