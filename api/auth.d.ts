import { type User } from '@supabase/supabase-js';
export declare function getSupabaseAdmin(): import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare function requireUser(req: any): Promise<User>;
