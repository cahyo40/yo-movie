import '@/utils/dns_override';

// Use the authorized token from Adimoviebox.kt (Valid until July 2026)
const bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjY1NDQ3MzA2NDM5NjQ1MTYyMzIsImF0cCI6MywiZXh0IjoiMTc4MjUzNTQwMiIsImV4cCI6MTc5MDMxMTQwMiwiaWF0IjoxNzgyNTM1MTAyfQ.d2WpLFeF0erMdSlaaM1RMgnpyB4j1R1s2xVcY6a2Ut8";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const season = searchParams.get('season') || 0;
  const episode = searchParams.get('episode') || 0;
  const detailPath = searchParams.get('detailPath') || '';

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const token = bearerToken;

    const apiUrl = 'https://netfilm.world';
    const playUrl = `${apiUrl}/wefeed-h5api-bff/subject/play?subjectId=${id}&se=${season}&ep=${episode}&detailPath=${detailPath}`;
    const referer = `${apiUrl}/spa/videoPlayPage/movies/${detailPath}?id=${id}&detailSe=&detailEp=&lang=en&type=/movie/detail`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Origin': apiUrl,
      'Referer': referer,
      'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
      'Cookie': `mb_token="${token}"`
    };

    const playRes = await fetch(playUrl, { headers, cache: 'no-store' });
    if (!playRes.ok) {
      return Response.json({ error: `Failed to fetch play: ${playRes.statusText}` }, { status: playRes.status });
    }

    const playData = await playRes.json();
    const streams = playData?.data?.streams || [];

    let captions = [];
    if (streams.length > 0) {
      const streamId = streams[0]?.id;
      const format = streams[0]?.format;
      if (streamId && format) {
        const captionUrl = `https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/caption?format=${format}&id=${streamId}&subjectId=${id}&detailPath=${detailPath}`;
        const captionHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://netfilm.world/',
          'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' })
        };
        const captionRes = await fetch(captionUrl, { headers: captionHeaders, cache: 'no-store' });
        if (captionRes.ok) {
          const captionData = await captionRes.json();
          captions = captionData?.data?.captions || [];
        }
      }
    }

    return Response.json({ streams, captions });
  } catch (error) {
    console.error('[Play API] Fetch error:', error);
    if (error.cause) {
      console.error('[Play API] Cause:', error.cause);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
