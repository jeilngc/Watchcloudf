// functions/api/items.js
// Auth is already enforced by functions/_middleware.js, so these handlers
// don't need to check it themselves.

import { json } from '../_lib/auth.js';

const KV_KEY = 'library:items';

export async function onRequestGet(context) {
    const { env } = context;
    try {
        const raw = await env.LIBRARY_KV.get(KV_KEY);
        const items = raw ? JSON.parse(raw) : null;
        return json(items);
    } catch (error) {
        console.error('KV Get Error:', error);
        return json({ error: 'Failed to fetch items from database.' }, 500);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { items } = await request.json();
        if (!Array.isArray(items)) {
            return json({ error: 'Invalid payload: items must be an array.' }, 400);
        }
        await env.LIBRARY_KV.put(KV_KEY, JSON.stringify(items));
        return json({ ok: true });
    } catch (error) {
        console.error('KV Set Error:', error);
        return json({ error: 'Failed to save items to database.' }, 500);
    }
}
