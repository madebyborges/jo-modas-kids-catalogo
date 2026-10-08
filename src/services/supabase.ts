import { createClient } from '@supabase/supabase-js';
const env=import.meta.env??{};const url=env.VITE_SUPABASE_URL; const key=env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key && /^https?:\/\//.test(url) ? createClient(url,key,{global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)})},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}) : null;
