const ARTIST_ID = '6hkNwIjIfDcMDp5AObEbO9'

let cachedToken = null
let tokenExpiresAt = 0

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await res.json()

  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000

  return cachedToken
}

module.exports = async function handler(req, res) {
  try {
    const token = await getToken()

    const headers = {
      Authorization: `Bearer ${token}`
    }

    const trackRes = await fetch(
      'https://api.spotify.com/v1/tracks/3EgO9ATzIBSEM8tXl0GmM3',
      { headers }
    )

    const track = await trackRes.json()

    res.status(200).json(track)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}
