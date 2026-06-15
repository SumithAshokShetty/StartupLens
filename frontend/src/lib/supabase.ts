import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vxwmxrmdgiasaonrlwiu.supabase.co';
const supabaseAnonKey = 'sb_publishable_Sjoz1CPsh4uiaUuWDQP8nw_RLRx56gv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
