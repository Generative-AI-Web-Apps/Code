import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
'use server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

const isProtectedRoute = createRouteMatcher(['/chat(.*)']);

const handleCORS = (request) => {
  if (request.method === 'OPTIONS') {
    const cors = NextResponse.next();
    cors.headers.set('Access-Control-Allow-Origin', '*');
    cors.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    cors.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return cors;
  }
  return NextResponse.next();
};

const rateLimit = async (request) => {
  const identifier = request.ip || '127.0.0.1';

  try {
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      console.log('Rate limit exceeded');
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }
    return NextResponse.next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

const securityHeaders = (request, response) => {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
};

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  const corsResponse = handleCORS(req);
  if (corsResponse instanceof NextResponse) {
    return corsResponse;
  }
  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse instanceof NextResponse) {
    return rateLimitResponse;
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
