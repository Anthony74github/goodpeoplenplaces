import { adminClient } from './_supabaseClient.js';

export default async function handler(req, res) {
  try {
    const supa = adminClient();
    const { data: posts, error: pe } = await supa
      .from('posts')
      .select('id,user_id,country,text,photo_url,created_at,name')
      .order('created_at', { ascending: false })
      .limit(100);
    if (pe) throw pe;

    const userIds = [...new Set(posts.map(p => p.user_id))];
    let profiles = [];
    if (userIds.length) {
      const { data: profs, error: pf } = await supa
        .from('profiles')
        .select('id,username,from,greeting,photo_url')
        .in('id', userIds);
      if (pf) throw pf;
      profiles = profs;
    }
    const map = new Map(profiles.map(p => [p.id, p]));
    const items = posts.map(p => ({ ...p, profile: map.get(p.user_id) || null }));
    res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'list_failed' });
  }
}
