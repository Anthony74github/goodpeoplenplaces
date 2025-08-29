// api/post.js (Vercel serverless function, Node ESM)
import { supabase, ADMIN_EMAILS, hasBadWords } from './_supabaseClient.js';

const RATE_LIMIT_SECONDS = parseInt(process.env.RATE_LIMIT_SECONDS || '30', 10); // per-user

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).send('Unauthorized');

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).send('Invalid token');
    const user = userData.user;

    const body = req.body || {};
    const { country, text, image_url, image_path, username, from, greeting } = body;

    if (!country || !text || !image_url || !image_path || !username) {
      return res.status(400).send('Missing required fields');
    }
    if (hasBadWords(text)) return res.status(400).send('Inappropriate language not allowed');
    if (!image_path.startsWith(user.id + '/')) return res.status(400).send('Invalid image path');

    // Simple per-user rate limit: ensure last post older than N seconds
    const { data: lastPosts, error: lastErr } = await supabase
      .from('posts')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastErr) console.warn('Rate check error', lastErr?.message);

    if (lastPosts && lastPosts.length) {
      const last = new Date(lastPosts[0].created_at).getTime();
      if (Date.now() - last < RATE_LIMIT_SECONDS * 1000) {
        return res.status(429).send('Please wait a bit before posting again.');
      }
    }

    const insert = {
      user_id: user.id,
      username,
      country,
      text,
      image_url,
      image_path,
      from: from || null,
      greeting: greeting || null
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(insert)
      .select('id,user_id,username,country,text,image_url,image_path,created_at')
      .single();

    if (error) return res.status(500).send(error.message);

    res.status(200).json({ item: data });
  } catch (e) {
    res.status(500).send(e.message || 'Unexpected error');
  }
}
