import '@/utils/dns_override';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const season = searchParams.get('season') || 0;
  const episode = searchParams.get('episode') || 0;
  const detailPath = searchParams.get('detailPath') || '';

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const apiUrl = 'https://fmoviesunblocked.net';
  const playUrl = `${apiUrl}/wefeed-h5-bff/web/subject/play?subjectId=${id}&se=${season}&ep=${episode}`;
  const referer = `${apiUrl}/spa/videoPlayPage/movies/${detailPath}?id=${id}&type=/movie/detail&lang=en`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': apiUrl,
    'Referer': referer
  };

  try {
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
        const captionUrl = `${apiUrl}/wefeed-h5-bff/web/subject/caption?format=${format}&id=${streamId}&subjectId=${id}`;
        const captionRes = await fetch(captionUrl, { headers, cache: 'no-store' });
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
