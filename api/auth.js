import { createClient } from '@supabase/supabase-js';
export function getSupabaseAdmin() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey)
        throw new Error('Supabase server environment variables are missing.');
    return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function requireUser(req) {
    const header = req.headers?.authorization || req.headers?.Authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token)
        throw new Error('Authentication required.');
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user)
        throw new Error('Invalid authentication token.');
    return data.user;
}
