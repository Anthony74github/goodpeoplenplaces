// api/_supabaseClient.js (Node ESM)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Simple list for bad-word filtering (expand as needed)
export const BAD_WORDS = (process.env.BAD_WORDS || 'damn,hell')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export function hasBadWords(text = '') {
  const t = (text || '').toLowerCase();
  return BAD_WORDS.some(w => w && t.includes(w));
}
