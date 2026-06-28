import '@/utils/dns_override';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const page = searchParams.get('page') || 1;

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  let apiUrl = 'https://fmoviesunblocked.net';
  if (process.env.VERCEL === '1') {
    apiUrl = 'https://moviebox.ph';
  }
  const url = `${apiUrl}/wefeed-h5-bff/web/ranking-list/content?id=${id}&page=${page}&perPage=12`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': apiUrl,
        'Referer': apiUrl + '/'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      return Response.json({ error: `Failed to fetch: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
