module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { name, email, message, subject } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Заповніть всі поля' })
  }

  console.log('Contact:', { name, email, subject, message })
  res.json({ success: true, message: 'Повідомлення надіслано!' })
}
