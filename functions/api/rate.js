// functions/api/rate.js
import { json } from '../_lib/auth.js';

const KV_KEY = 'library:items';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { id, person, rating, comment } = await request.json();

        if (!id || !person || (person !== 'may' && person !== 'jay')) {
            return json({ ok: false, error: 'Invalid rating data.' }, 400);
        }

        const raw = await env.LIBRARY_KV.get(KV_KEY);
        const items = raw ? JSON.parse(raw) : null;
        if (!items || !Array.isArray(items)) {
            return json({ ok: false, error: 'Library not found in database.' }, 404);
        }

        const itemIndex = items.findIndex((i) => i.id === Number(id));
        if (itemIndex === -1) {
            return json({ ok: false, error: 'Item not found.' }, 404);
        }

        const item = items[itemIndex];
        if (!item.watched) {
            item.watched = {};
        }

        item.watched[person] = {
            rating: Number(rating),
            comment: String(comment || '')
        };

        items[itemIndex] = item;
        await env.LIBRARY_KV.put(KV_KEY, JSON.stringify(items));

        return json({ ok: true, item });
    } catch (error) {
        console.error('Rate Error:', error);
        return json({ ok: false, error: 'Server error while saving rating.' }, 500);
    }
}
