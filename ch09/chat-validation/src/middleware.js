import { NextResponse } from 'next/server';
// Middleware composer function
const composeMiddleware = (middlewares) => {
  return async (request) => {
    let response = NextResponse.next();

    for (const middleware of middlewares) {
      try {
        const result = await middleware(request, response);
        if (result.response) return result.response;
        if (result.continue === false) break;
      } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    }

    return response;
  };
};

const handleCORS = async (request, response) => {
  if (request.method === 'OPTIONS') {
    const cors = NextResponse.next();
    cors.headers.set('Access-Control-Allow-Origin', '*');
    cors.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    cors.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return { response: cors };
  }
  return { continue: true };
};

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"), // Allow 5 requests per 10 seconds
});


const rateLimit = async (request, response) => {
  const identifier = request.ip || '127.0.0.1';

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    if (!success) {
      console.log("Rate limit exceeded");
      return {
        response: NextResponse.json({ message: "Too many requests" }, { status: 429 }),
        continue: false,
      };
    }

    return { continue: true };

  } catch (error) {
    console.error("Rate limiting error:", error);
    return {
      response: NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      continue: false,
    };
  }
};


const authenticate = async (request, response) => {
  // const token = request.headers.get('authorization')?.split('Bearer ')[1];
  
  // if (!token) {
  //   return {
  //     response: NextResponse.json(
  //       { error: 'Unauthorized' },
  //       { status: 401 }
  //     )
  //   };
  // }
  
  // Verify token here
  // const isValid = await verifyToken(token);
  return { continue: true };
};

const securityHeaders = async (request, response) => {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return { continue: true };
};

const middlewareChain = composeMiddleware([
  handleCORS,
  rateLimit,
  authenticate,
  securityHeaders, 
]);

export async function middleware(request) {
  return await middlewareChain(request);
}

export const config = {
  matcher: '/api/:path*',
};