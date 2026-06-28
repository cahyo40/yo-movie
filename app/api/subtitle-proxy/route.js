export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subtitleUrl = searchParams.get('url');

  if (!subtitleUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(subtitleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!res.ok) {
      return new Response(`Failed to fetch subtitle: ${res.status}`, { status: res.status });
    }

    let text = await res.text();

    // Convert SRT to WebVTT if needed
    const isSrt = subtitleUrl.toLowerCase().includes('.srt') || !text.trim().startsWith('WEBVTT');

    if (isSrt) {
      text = srtToVtt(text);
    }

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('[Subtitle Proxy] Error:', error);
    return new Response(error.message, { status: 500 });
  }
}

/**
 * Convert SRT subtitle format to WebVTT format
 */
function srtToVtt(srtText) {
  // Remove BOM if present
  let text = srtText.replace(/^\uFEFF/, '');

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace SRT timestamp format (00:00:00,000) with VTT format (00:00:00.000)
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  // Add WEBVTT header
  return 'WEBVTT\n\n' + text.trim() + '\n';
}
