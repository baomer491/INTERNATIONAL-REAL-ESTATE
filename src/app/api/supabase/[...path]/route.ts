import { NextRequest, NextResponse } from 'next/server';

// Read at runtime, not module load time
function getSupabaseUrl() {
  return process.env.SUPABASE_INTERNAL_URL || 'http://10.0.2.9:8000';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params);
}

async function proxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
) {
  try {
    const { path } = await paramsPromise;
    const pathStr = path.join('/');
    const url = new URL(request.url);
    const targetUrl = `${getSupabaseUrl()}/${pathStr}${url.search}`;

    // Forward relevant headers
    const headers = new Headers();
    const forwardHeaders = [
      'content-type', 'accept',
      'prefer', 'x-client-info', 'range', 'accept-profile',
      'content-profile',
    ];
    for (const h of forwardHeaders) {
      const val = request.headers.get(h);
      if (val) headers.set(h, val);
    }

    // Inject the real apikey from server env so the client doesn't need it at build time
    const realAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (realAnonKey) {
      headers.set('apikey', realAnonKey);
      // Also set/override Authorization if client sent one with a dummy key
      const clientAuth = request.headers.get('authorization');
      if (clientAuth && clientAuth.startsWith('Bearer ')) {
        const clientToken = clientAuth.slice(7);
        // If client sent a dummy/non-JWT token, replace with real anon key
        if (!clientToken.includes('.') || clientToken === 'proxy-handled') {
          headers.set('authorization', `Bearer ${realAnonKey}`);
        } else {
          headers.set('authorization', clientAuth);
        }
      } else {
        headers.set('authorization', `Bearer ${realAnonKey}`);
      }
    } else {
      // No server-side key available, forward client's original headers
      for (const h of ['apikey', 'authorization']) {
        const val = request.headers.get(h);
        if (val) headers.set(h, val);
      }
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOptions.body = await request.text();
    }

    const response = await fetch(targetUrl, fetchOptions);
    const body = await response.text();

    const respHeaders = new Headers();
    respHeaders.set('Content-Type', response.headers.get('content-type') || 'application/json');
    const contentRange = response.headers.get('content-range');
    if (contentRange) respHeaders.set('Content-Range', contentRange);

    return new NextResponse(body, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('[supabase-proxy] Error:', err);
    return NextResponse.json({ error: 'proxy_error' }, { status: 502 });
  }
}
