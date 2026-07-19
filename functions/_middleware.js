// functions/_middleware.js
// Runs before EVERY request to this Pages project (static pages and /api/*
// alike). Anything not explicitly public requires a valid session cookie.

import { isAuthenticated } from './_lib/auth.js';

const PUBLIC_PATHS = new Set(['/login.html', '/api/login', '/api/logout']);

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    if (PUBLIC_PATHS.has(url.pathname)) {
        return next();
    }

    const authed = await isAuthenticated(request, env.COOKIE_SECRET);

    if (!authed) {
        if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return Response.redirect(`${url.origin}/login.html`, 302);
    }

    return next();
}
