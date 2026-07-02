const ARTIST_ID = '6hkNwIjIfDcMDp5AObEbO9'
const TRACK_ID = '3EgO9ATzIBSEM8tXl0GmM3'

let cachedToken = null
let tokenExpiresAt = 0

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    throw new Error(JSON.stringify(tokenData))
  }

  cachedToken = tokenData.access_token
  tokenExpiresAt = Date.now() + tokenData.expires_in * 1000 - 60000

  return cachedToken
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const token = await getToken()

    const headers = {
      Authorization: `Bearer ${token}`
    }

    const [artistRes, trackRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}`, { headers }),
      fetch(`https://api.spotify.com/v1/tracks/${TRACK_ID}`, { headers })
    ])

    const artist = await artistRes.json()
    const track = await trackRes.json()

    res.status(200).json({
      artist,
      tracks: [track]
    })

  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
}
