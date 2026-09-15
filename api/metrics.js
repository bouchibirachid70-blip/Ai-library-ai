// /api/metrics — admin dashboard summary.

import { handleOptions } from './_lib/cors.js';
import { serverError } from './_lib/validation.js';
import { requireAdmin } from './_lib/auth.js';
import supabase from './_lib/db-client.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      allTools,
      approvedTools,
      pendingTools,
      rejectedTools,
      allCats,
      allArticles,
      publishedArticles,
      allSubs,
      pendingSubs,
      allClicks,
      recentClicks,
      topTools,
    ] = await Promise.all([
      supabase.from('tools').select('id', { count: 'exact', head: true }),
      supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('clicks').select('id', { count: 'exact', head: true }),
      supabase.from('clicks').select('id', { count: 'exact', head: true }).gte('clicked_at', since),
      supabase
        .from('tools')
        .select('id, name, slug, clicks_count')
        .eq('status', 'approved')
        .order('clicks_count', { ascending: false })
        .limit(8),
    ]);

    const errors = [
      allTools.error,
      approvedTools.error,
      pendingTools.error,
      rejectedTools.error,
      allCats.error,
      allArticles.error,
      publishedArticles.error,
      allSubs.error,
      pendingSubs.error,
      allClicks.error,
      recentClicks.error,
      topTools.error,
    ].filter(Boolean);
    if (errors.length > 0) throw errors[0];

    return res.status(200).json({
      total_tools: allTools.count || 0,
      approved_tools: approvedTools.count || 0,
      pending_tools: pendingTools.count || 0,
      rejected_tools: rejectedTools.count || 0,
      total_categories: allCats.count || 0,
      total_articles: allArticles.count || 0,
      published_articles: publishedArticles.count || 0,
      total_submissions: allSubs.count || 0,
      pending_submissions: pendingSubs.count || 0,
      total_clicks: allClicks.count || 0,
      recent_clicks: recentClicks.count || 0,
      top_tools: (topTools.data || []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        clicks_count: t.clicks_count || 0,
      })),
    });
  } catch (err) {
    return serverError(res, err);
  }
}
