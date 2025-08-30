import { adminClient, requireUser } from './_supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const user = await requireUser(req.headers.authorization || '');
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const { country, text, photo_url, name } = req.body || {};
    if (!photo_url || !text) return res.status(400).json({ error: 'missing_fields' });

    const supa = adminClient();
    const { data, error } = await supa
      .from('posts')
      .insert([{ user_id: user.id, country: country || '', text, photo_url, name: name || '' }])
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ ok: true, post: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'post_failed' });
  }
}
