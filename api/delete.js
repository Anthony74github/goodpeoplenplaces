import { adminClient, requireUser } from './_supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const user = await requireUser(req.headers.authorization || '');
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const supa = adminClient();

    const { data: post, error: ge } = await supa.from('posts').select('id,user_id,photo_url').eq('id', id).single();
    if (ge || !post) return res.status(404).json({ error: 'not_found' });

    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const isAdmin = admins.includes((user.email || '').toLowerCase());

    if (post.user_id !== user.id && !isAdmin) return res.status(403).json({ error: 'forbidden' });

    const { error: de } = await supa.from('posts').delete().eq('id', id);
    if (de) throw de;

    try {
      const url = post.photo_url || '';
      const publicPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/`;
      if (url.startsWith(publicPrefix)) {
        const rel = url.slice(publicPrefix.length);
        const slash = rel.indexOf('/');
        if (slash !== -1) {
          const bucket = rel.slice(0, slash);
          const path = rel.slice(slash + 1);
          if (bucket) {
            await supa.storage.from(bucket).remove([path]);
          }
        }
      }
    } catch (e) {}

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'delete_failed' });
  }
}
