import { initDnsOverride } from '@/utils/dns_override';
initDnsOverride();

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
    console.error('[Detail API] Failed to obtain auth token:', err);
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return Response.json({ error: 'Failed to get API auth token' }, { status: 500 });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Client-Info': JSON.stringify({ timezone: 'Asia/Jakarta' }),
      'Origin': 'https://moviebox.ph',
      'Referer': 'https://moviebox.ph/'
    };

    const isNumeric = /^\d+$/.test(id);
    let detailData = null;
    let detailRes = null;

    if (isNumeric) {
      // Lookup by subjectId
      const subjectIdUrl = `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?subjectId=${id}`;
      detailRes = await fetch(subjectIdUrl, { headers, cache: 'no-store' });
      if (detailRes.ok) {
        detailData = await detailRes.json();
      }
    } else {
      // Lookup by detailPath
      const detailPathUrl = `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath=${id}`;
      detailRes = await fetch(detailPathUrl, { headers, cache: 'no-store' });
      if (detailRes.ok) {
        detailData = await detailRes.json();
      }
    }

    // Fallback try the other one if failed
    if (!detailData || !detailData.data?.subject) {
      const fallbackUrl = isNumeric
        ? `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath=${id}`
        : `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?subjectId=${id}`;
      
      detailRes = await fetch(fallbackUrl, { headers, cache: 'no-store' });
      if (detailRes.ok) {
        const temp = await detailRes.json();
        if (temp?.data?.subject) {
          detailData = temp;
        }
      }
    }

    if (!detailData || !detailData.data) {
      return Response.json({ error: 'Failed to fetch details from both endpoints' }, { status: 404 });
    }

    // Extract real subject ID for recommendations
    const realId = detailData.data.subject?.subjectId || id;
    const recUrl = `https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/detail-rec?subjectId=${realId}&page=1&perPage=12`;
    
    const recRes = await fetch(recUrl, { headers, cache: 'no-store' });
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
