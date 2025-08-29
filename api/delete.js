// api/delete.js (Vercel serverless function, Node ESM)
import { supabase, ADMIN_EMAILS } from './_supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).send('Unauthorized');

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).send('Invalid token');
    const user = userData.user;

    const { id, image_path } = req.body || {};
    if (!id) return res.status(400).send('Missing post id');

    // Fetch post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id,user_id,image_path')
      .eq('id', id)
      .single();

    if (postErr || !post) return res.status(404).send('Post not found');

    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
    if (!(isAdmin || post.user_id === user.id)) return res.status(403).send('Forbidden');

    // Delete DB row
    const { error: delErr } = await supabase.from('posts').delete().eq('id', id);
    if (delErr) return res.status(500).send(delErr.message);

    // Delete image if path provided
    const path = image_path || post.image_path;
    if (path) {
      const { error: imgErr } = await supabase.storage.from('trip-photos').remove([path]);
      if (imgErr) console.warn('Storage deletion error:', imgErr.message);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message || 'Unexpected error');
  }
}
