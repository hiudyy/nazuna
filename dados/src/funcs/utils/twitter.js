/**
 * Twitter/X Download - Implementação direta sem API externa
 */

import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36';
const API_URL = (id) => `https://info.tweeload.site/status/${id}.json`;
const AUTH_URL = 'https://pastebin.com/raw/SnCfd4ru';

// Cache
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
let cachedAuth = null;
let authCacheTime = null;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

async function getAuthorization() {
  if (cachedAuth && authCacheTime && (Date.now() - authCacheTime < 5 * 60 * 1000)) {
    return cachedAuth;
  }
  
  const response = await axios.get(AUTH_URL, { timeout: 30000 });
  cachedAuth = response.data.trim();
  authCacheTime = Date.now();
  return cachedAuth;
}

function extractTweetId(url) {
  if (!url) throw new Error('URL não fornecida');
  
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /\/status\/(\d+)/,
    /\/(\d{10,})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  throw new Error('URL do Twitter/X inválida');
}

/**
 * Obter informações e mídia do tweet
 * @param {string} url - URL do tweet
 * @returns {Promise<Object>} Informações do tweet
 */
async function getInfo(url) {
  try {
    if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
      return { ok: false, msg: 'URL inválida. Forneça uma URL válida do Twitter/X.' };
    }

    const tweetId = extractTweetId(url);

    // Verificar cache
    const cached = getCached(`twitter:${tweetId}`);
    if (cached) return { ok: true, ...cached, cached: true };

    console.log(`[Twitter] Obtendo informações do tweet ID: ${tweetId}`);

    const authorization = await getAuthorization();

    const response = await axios.get(API_URL(tweetId), {
      headers: {
        'Authorization': authorization,
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      timeout: 60000
    });

    const data = response.data;

    if (data.code !== 200) {
      return { ok: false, msg: 'Tweet não encontrado ou indisponível' };
    }

    // Processar autor
    const author = {
      id: data.tweet.author.id,
      name: data.tweet.author.name,
      username: data.tweet.author.screen_name,
      avatarUrl: data.tweet.author.avatar_url,
      bannerUrl: data.tweet.author.banner_url
    };

    // Processar mídia
    let media = [];
    let type = 'text';

    if (data.tweet?.media?.videos?.length > 0) {
      type = 'video';
      
      for (const video of data.tweet.media.videos) {
        const videoUrls = [];
        
        if (video.video_urls && Array.isArray(video.video_urls)) {
          for (const v of video.video_urls) {
            const resolutionMatch = v.url.match(/([\d]{2,5}[x][\d]{2,5})/);
            videoUrls.push({
              bitrate: v.bitrate,
              contentType: v.content_type,
              resolution: resolutionMatch ? resolutionMatch[0] : 'unknown',
              url: v.url
            });
          }
        }

        videoUrls.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        if (videoUrls.length > 0 || video.type === 'gif') {
          media.push({
            type: video.type,
            duration: video.duration,
            thumbnailUrl: video.thumbnail_url,
            variants: video.type === 'video' ? videoUrls : undefined,
            url: video.type === 'gif' ? video.url : (videoUrls[0]?.url || null),
            bestQuality: videoUrls[0] || null
          });
        }
      }
    } else if (data.tweet?.media?.photos?.length > 0) {
      type = 'photo';
      
      for (const photo of data.tweet.media.photos) {
        media.push({
          type: 'photo',
          url: photo.url || photo,
          urlHD: (photo.url || photo).replace(/\.(jpg|png)$/, '?format=$1&name=large')
        });
      }
    }

    const result = {
      id: data.tweet.id,
      text: data.tweet.text,
      createdAt: data.tweet.created_at,
      url: data.tweet.url || `https://twitter.com/i/status/${tweetId}`,
      stats: {
        replies: data.tweet.replies,
        retweets: data.tweet.retweets,
        likes: data.tweet.likes
      },
      author,
      type,
      media: media.length > 0 ? media : null,
      hasMedia: media.length > 0
    };

    setCache(`twitter:${tweetId}`, result);

    return { ok: true, ...result };
  } catch (error) {
    console.error('[Twitter] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao obter informações do tweet' };
  }
}

export default { getInfo };
export { getInfo };
