import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The news/admin features need Supabase; if env vars aren't configured the rest
// of the app must still work, so only create the client when both are present.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
