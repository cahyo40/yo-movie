import '@/utils/dns_override';

// Cache the auth token for reuse (valid for ~90 days)
let cachedToken = null;
let tokenExpiry = 0;

async function getAuthToken() {
  // Reuse cached token if still valid (refresh every 30 minutes to be safe)
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const res = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/country-code', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://netfilm.world',
        'Referer': 'https://netfilm.world/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const xUser = res.headers.get('x-user');
    if (xUser) {
      const userData = JSON.parse(xUser);
      if (userData.token) {
        cachedToken = userData.token;
        tokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
        return cachedToken;
      }
    }
  } catch (err) {
    console.error('[Home API] Failed to obtain auth token:', err);
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const page = searchParams.get('page') || 1;

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return Response.json({ error: 'Failed to get API auth token' }, { status: 500 });
    }

    const apiUrl = 'https://h5-api.aoneroom.com';
    const url = `${apiUrl}/wefeed-h5api-bff/ranking-list/content?id=${id}&page=${page}&perPage=12`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
        'Origin': 'https://moviebox.ph',
        'Referer': 'https://moviebox.ph/'
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
