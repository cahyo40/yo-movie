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
        'Origin': 'https://fmoviesunblocked.net',
        'Referer': 'https://fmoviesunblocked.net/',
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
    console.error('[Search API] Failed to obtain auth token:', err);
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return Response.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return Response.json({ error: 'Failed to get API auth token' }, { status: 500 });
    }

    const res = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/search', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
        'X-Request-Lang': 'en',
        'Origin': 'https://fmoviesunblocked.net',
        'Referer': 'https://fmoviesunblocked.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        keyword: q,
        page: 1,
        perPage: 30,
        subjectType: 0
      })
    });

    if (!res.ok) {
      // Token might have expired, clear cache and retry once
      cachedToken = null;
      tokenExpiry = 0;
      const retryToken = await getAuthToken();
      if (retryToken) {
        const retryRes = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/search', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${retryToken}`,
            'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
            'X-Request-Lang': 'en',
            'Origin': 'https://fmoviesunblocked.net',
            'Referer': 'https://fmoviesunblocked.net/'
          },
          body: JSON.stringify({
            keyword: q,
            page: 1,
            perPage: 30,
            subjectType: 0
          })
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          return Response.json(retryData);
        }
      }
      return Response.json({ error: `Search failed: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
