
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcanzvyqmagrjqhpsfcd.supabase.co';
const supabaseAnonKey = 'sb_publishable_3dDgayq2xIEl4ML9a0VRuQ_mRgBz_iH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKETS = {
  AVATARS: 'avatars',
  REQUESTS: 'requests'
};
