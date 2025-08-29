// api/list.js (Vercel serverless function, Node ESM)
import { supabase, ADMIN_EMAILS } from './_supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    let user = null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    }

    const { data, error } = await supabase
      .from('posts')
      .select('id,user_id,username,country,text,image_url,image_path,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).send(error.message);

    const items = (data || []).map(row => ({
      ...row,
      canDelete: !!(user && (user.id === row.user_id || (user.email && ADMIN_EMAILS.includes(user.email))))
    }));

    res.status(200).json({ items });
  } catch (e) {
    res.status(500).send(e.message || 'Unexpected error');
  }
}
