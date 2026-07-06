module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { name, email, message, subject } = req.body || {}
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Заповніть всі поля' })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env variable is not set')
    return res.status(500).json({ error: 'Сервіс тимчасово недоступний' })
  }

  const text =
    `Нове повідомлення з сайту\n\n` +
    `Ім'я: ${name}\n` +
    `Email: ${email}\n` +
    (subject ? `Тема: ${subject}\n` : '') +
    `Повідомлення:\n${message}`

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })

    if (!tgRes.ok) {
      const errBody = await tgRes.text()
      throw new Error(`Telegram sendMessage failed (${tgRes.status}): ${errBody}`)
    }

    res.json({ success: true, message: 'Повідомлення надіслано!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Не вдалося надіслати повідомлення' })
  }
}
