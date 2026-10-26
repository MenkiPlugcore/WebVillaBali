import { SITE, pages } from './seo/config.js';
import { metadata, propertyPage, propertySummary, escapeHTML } from './seo/render.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const security = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://tvcmwkzwemrwwewphfgh.supabase.co; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://tvcmwkzwemrwwewphfgh.supabase.co; media-src 'self' https://res.cloudinary.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};
function reply(body, status, type, head = false, extra = {}) {
  return new Response(head ? null : body, { status, headers: { ...security, 'Content-Type': type, 'Cache-Control': 'no-store', ...extra } });
}
function failure(status, head) {
  const unavailable = status === 503;
  const title = unavailable ? 'Please try again shortly' : 'Property not found';
  return reply(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>${title} | ${SITE.name}</title><link rel="stylesheet" href="/styles.css"></head><body><main class="shell section"><h1>${title}</h1><p>${unavailable ? 'The property catalogue is temporarily unavailable.' : 'This listing is not available on the website.'}</p><p><a href="/#properties">Browse properties</a> · <a href="/#contact">Contact our team</a></p></main></body></html>`, status, 'text/html; charset=utf-8', head, { 'X-Robots-Tag': 'noindex, follow', ...(unavailable ? { 'Retry-After': '60' } : {}) });
}
async function readCatalog(params, fetcher) {
  const response = await fetcher(SITE.catalog + '?' + new URLSearchParams(params), { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 404 && params.slug) return { properties: [] };
  if (!response.ok) throw Error('Catalogue unavailable');
  const data = await response.json();
  if (!Array.isArray(data.properties)) throw Error('Invalid catalogue response');
  return data;
}
export async function handle(request, env, fetcher = fetch) {
  const url = new URL(request.url), head = request.method === 'HEAD';
  const panel = /^\/(admin|dev)(\/|$)/.test(url.pathname);
  if (panel || ['/pay', '/pay/', '/pay.html'].includes(url.pathname)) {
    const response = await env.ASSETS.fetch(request), headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(security)) headers.set(name, value);
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://tvcmwkzwemrwwewphfgh.supabase.co; img-src 'self' data:" + (panel ? ' https://tvcmwkzwemrwwewphfgh.supabase.co' : '') + "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    return new Response(head ? null : response.body, { status: response.status, statusText: response.statusText, headers });
  }
  const legacy = url.pathname.match(/^\/properties\/([a-z0-9-]+?)(?:\.html)?\/?$/);
  const detail = ['/property', '/property/', '/property.html'].includes(url.pathname);
  if (url.pathname !== '/sitemap.xml' && !detail && !legacy) return env.ASSETS.fetch(request);
  if (!['GET', 'HEAD'].includes(request.method)) return reply('Method not allowed', 405, 'text/plain; charset=utf-8', false, { Allow: 'GET, HEAD' });
  if (legacy) return reply(null, 301, 'text/plain; charset=utf-8', head, { Location: SITE.origin + '/property?slug=' + encodeURIComponent(legacy[1]) });
  try {
    if (url.pathname === '/sitemap.xml') {
      const paths = new Set(pages.filter(page => page.index).map(page => page.path));
      let complete = false;
      for (let page = 0; page < 25; page++) {
        const data = await readCatalog({ page: String(page) }, fetcher);
        for (const row of data.properties) if (typeof row.slug === 'string' && row.slug.length <= 160 && slugPattern.test(row.slug)) paths.add('/property?slug=' + encodeURIComponent(row.slug));
        if (!data.hasMore) { complete = true; break; }
      }
      if (!complete) throw Error('Sitemap pagination limit');
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + [...paths].map(path => `<url><loc>${escapeHTML(SITE.origin + path)}</loc></url>`).join('\n') + '\n</urlset>\n';
      return reply(xml, 200, 'application/xml; charset=utf-8', head);
    }
    const slug = url.searchParams.get('slug');
    if (!slug || url.searchParams.getAll('slug').length !== 1 || slug.length > 160 || !slugPattern.test(slug)) return failure(404, head);
    const data = await readCatalog({ slug }, fetcher), row = data.properties[0];
    if (!row) return failure(404, head);
    if (row.slug !== slug || typeof (row.title_en || row.title_id) !== 'string') throw Error('Invalid property');
    if (url.pathname !== '/property') return reply(null, 301, 'text/plain; charset=utf-8', head, { Location: SITE.origin + '/property?slug=' + encodeURIComponent(slug) });
    const templateURL = new URL('/property', url.origin);
    const template = await env.ASSETS.fetch(new Request(templateURL));
    if (template.status !== 200) throw Error('Property template unavailable');
    let html = metadata(await template.text(), propertyPage(row));
    html = html.replace(/(<main\b[^>]*\bid="liveProperty"[^>]*>)[\s\S]*?(<\/main>)/i, (_, open, close) => open.replace('aria-busy="true"', 'aria-busy="false"') + propertySummary(row) + close);
    return reply(html, 200, 'text/html; charset=utf-8', head);
  } catch {
    return url.pathname === '/sitemap.xml' ? reply('Sitemap temporarily unavailable', 503, 'text/plain; charset=utf-8', head, { 'Retry-After': '60', 'X-Robots-Tag': 'noindex' }) : failure(503, head);
  }
}
export default { fetch: (request, env) => handle(request, env) };
