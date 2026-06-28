import '@/utils/dns_override';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Forward Range headers sent by browser for seeking/scrubbing
  const rangeHeader = request.headers.get('range');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://fmoviesunblocked.net/',
    'Accept': '*/*'
  };

  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  try {
    const res = await fetch(videoUrl, { 
      headers,
      method: 'GET'
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isM3u8 = videoUrl.toLowerCase().includes('.m3u8') || 
                   contentType.includes('mpegurl') || 
                   contentType.includes('mpeg-url') ||
                   contentType.includes('apple.mpegurl');

    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (isM3u8) {
      const text = await res.text();
      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) {
          return line;
        }
        
        let absoluteUrl;
        try {
          absoluteUrl = new URL(trimmed, videoUrl).toString();
        } catch (e) {
          absoluteUrl = trimmed;
        }
        
        const requestUrl = new URL(request.url);
        const proxyBaseUrl = `${requestUrl.protocol}//${requestUrl.host}/api/stream-proxy`;
        return `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}`;
      });
      
      const rewrittenText = rewrittenLines.join('\n');
      resHeaders.set('Content-Type', 'application/x-mpegURL');
      resHeaders.set('Content-Length', Buffer.byteLength(rewrittenText).toString());
      
      return new Response(rewrittenText, {
        status: res.status,
        headers: resHeaders
      });
    }

    // Default progressive/binary stream piping
    resHeaders.set('Content-Type', res.headers.get('content-type') || 'video/mp4');

    if (res.headers.get('content-range')) {
      resHeaders.set('Content-Range', res.headers.get('content-range'));
    }
    if (res.headers.get('accept-ranges')) {
      resHeaders.set('Accept-Ranges', res.headers.get('accept-ranges'));
    }
    if (res.headers.get('content-length')) {
      resHeaders.set('Content-Length', res.headers.get('content-length'));
    }

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders
    });
  } catch (error) {
    console.error('[Stream Proxy] Connection failed:', error);
    return new Response(error.message, { status: 500 });
  }
}
