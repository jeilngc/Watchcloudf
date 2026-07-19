// functions/api/logout.js
import { clearCookie, json } from '../_lib/auth.js';

export async function onRequest() {
    return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}
