// functions/api/login.js
import { createToken, authCookie, json } from '../_lib/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    let body = {};
    try {
        body = await request.json();
    } catch (e) {
        // Missing/invalid JSON body — fall through with empty body.
    }

    const { password } = body;
    const sitePassword = env.SITE_PASSWORD;

    if (!sitePassword) {
        return json({ error: 'SITE_PASSWORD is not configured on the server.' }, 500);
    }

    if (password === sitePassword) {
        const token = await createToken(env.COOKIE_SECRET);
        return json({ ok: true }, 200, { 'Set-Cookie': authCookie(token) });
    }

    return json({ ok: false, error: 'Wrong password.' }, 401);
}

export async function onRequestGet() {
    return json({ error: 'Method not allowed' }, 405);
}
