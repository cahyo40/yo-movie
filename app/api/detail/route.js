import '@/utils/dns_override';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  let apiUrl = 'https://fmoviesunblocked.net';
  if (process.env.VERCEL === '1') {
    apiUrl = 'https://moviebox.ph';
  }
  const detailUrl = `${apiUrl}/wefeed-h5-bff/web/subject/detail?subjectId=${id}`;
  const recUrl = `${apiUrl}/wefeed-h5-bff/web/subject/detail-rec?subjectId=${id}&page=1&perPage=12`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': apiUrl,
    'Referer': apiUrl + '/'
  };

  try {
    const [detailRes, recRes] = await Promise.all([
      fetch(detailUrl, { headers, cache: 'no-store' }),
      fetch(recUrl, { headers, cache: 'no-store' })
    ]);

    if (!detailRes.ok) {
      return Response.json({ error: `Failed to fetch detail: ${detailRes.statusText}` }, { status: detailRes.status });
    }

    const detailData = await detailRes.json();
    let recData = null;
    if (recRes.ok) {
      recData = await recRes.json();
    }

    return Response.json({
      detail: detailData.data || null,
      recommendations: recData?.data?.items || []
    });
  } catch (error) {
    console.error('[Detail API] Error fetching details:', error);
    if (error.cause) {
      console.error('[Detail API] Cause:', error.cause);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
