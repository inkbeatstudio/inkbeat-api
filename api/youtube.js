const CHANNEL_HANDLE = '@1nkbeat12'

let cachedUploadsPlaylistId = null
let cachedChannelId = null
let cachedChannelSnippet = null

async function getUploadsPlaylistId() {
  if (cachedUploadsPlaylistId) {
    return { uploadsPlaylistId: cachedUploadsPlaylistId, channelId: cachedChannelId, channel: cachedChannelSnippet }
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(CHANNEL_HANDLE)}&key=${process.env.YOUTUBE_API_KEY}`
  )

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`YouTube channels request failed (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const channel = data.items && data.items[0]

  if (!channel) {
    throw new Error(`Channel not found for handle ${CHANNEL_HANDLE}`)
  }

  cachedUploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads
  cachedChannelId = channel.id
  cachedChannelSnippet = channel.snippet

  return { uploadsPlaylistId: cachedUploadsPlaylistId, channelId: cachedChannelId, channel: cachedChannelSnippet }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { uploadsPlaylistId, channelId, channel } = await getUploadsPlaylistId()

    async function fetchPlaylistItems(playlistId) {
      return fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
      )
    }

    let videosRes = await fetchPlaylistItems(uploadsPlaylistId)
    let usedPlaylistId = uploadsPlaylistId

    if (!videosRes.ok && videosRes.status === 404 && channelId && channelId.startsWith('UC')) {
      const fallbackPlaylistId = 'UU' + channelId.slice(2)
      if (fallbackPlaylistId !== uploadsPlaylistId) {
        videosRes = await fetchPlaylistItems(fallbackPlaylistId)
        usedPlaylistId = fallbackPlaylistId
      }
    }

    if (!videosRes.ok) {
      const errBody = await videosRes.text()
      throw new Error(
        `YouTube playlistItems request failed (${videosRes.status}): ${errBody} | channelId=${channelId} uploadsPlaylistId=${uploadsPlaylistId} triedPlaylistId=${usedPlaylistId}`
      )
    }

    const videosData = await videosRes.json()

    const videos = (videosData.items || [])
      .filter(item =>
        item.snippet &&
        item.snippet.resourceId &&
        item.snippet.resourceId.videoId &&
        item.snippet.title !== 'Private video' &&
        item.snippet.title !== 'Deleted video'
      )
      .map(item => {
        const thumbs = item.snippet.thumbnails || {}
        const thumbnail =
          (thumbs.maxres && thumbs.maxres.url) ||
          (thumbs.high && thumbs.high.url) ||
          (thumbs.medium && thumbs.medium.url) ||
          (thumbs.default && thumbs.default.url) ||
          null

        return {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail
        }
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    res.status(200).json({
      channelId,
      channel,
      videos
    })

  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
}
