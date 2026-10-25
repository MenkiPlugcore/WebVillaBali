import { readFile, writeFile } from 'node:fs/promises';
import { SITE, pages } from '../seo/config.js';
import { metadata, escapeHTML as esc, organization, canonical } from '../seo/render.js';
import { policies } from './policy-content.js';
const root = new URL('../', import.meta.url);
const links = '<nav class="shell site-policy-links" data-policy-links aria-label="Website policies"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cancellation">Cancellations & refunds</a></nav>';

for (const [key, languages] of Object.entries(policies)) {
  const content = Object.entries(languages).map(([lang, c]) => `<div data-policy-lang="${lang}"${lang === 'id' ? ' hidden' : ''}><section class="policy-hero"><div class="shell"><p class="eyebrow">${esc(c.label)}</p><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p><small>${lang === 'id' ? 'Diperbarui' : 'Updated'} <time datetime="${SITE.policyDate}">${lang === 'id' ? '25 Oktober 2026' : '25 October 2026'}</time></small></div></section><div class="shell policy-layout"><aside class="policy-contents" aria-label="${lang === 'id' ? 'Isi halaman' : 'On this page'}">${c.sections.map(([title], i) => `<a href="#${key}-${lang}-${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(title)}</a>`).join('')}</aside><article class="policy-body">${c.sections.map(([title, paragraphs], i) => `<section id="${key}-${lang}-${i + 1}"><p class="policy-number">${String(i + 1).padStart(2, '0')}</p><h2>${esc(title)}</h2>${paragraphs.map(p => `<p>${p}</p>`).join('')}</section>`).join('')}<section class="policy-contact"><h2>${lang === 'id' ? 'Hubungi tim' : 'Contact the team'}</h2><div data-public-contact><a href="/#contact">${lang === 'id' ? 'Hubungi melalui tiket' : 'Contact via inquiry ticket'}</a></div></section></article></div></div>`).join('');
  const nav = Object.keys(policies).map(name => `<a href="/${name}" data-policy-nav="${name}"${name === key ? ' aria-current="page"' : ''}>${esc(policies[name].en.label)}</a>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#10221b"><title>${languages.en.label} | ${SITE.name}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css?v=20261025-socials-1"><link rel="stylesheet" href="/policies.css?v=20261025-1"></head><body class="policy-page" data-policy="${key}"><a class="policy-skip" href="#main">Skip to content</a><header class="policy-header"><div class="shell"><a class="policy-brand" href="/">Agung Ubud <span>Property</span></a><button id="policyLanguage" type="button" aria-label="Change language">EN</button></div></header><nav class="policy-nav shell" aria-label="Website policies">${nav}</nav><main id="main">${content}</main><footer>${links}<div class="shell footer-bottom"><span>© 2026 ${SITE.name}</span><a href="/#contact" data-policy-contact-link>Contact our team</a></div></footer><script src="/policies.js?v=20261025-1"></script><script src="/public-settings.js?v=20261025-socials-1"></script></body></html>\n`;
  await writeFile(new URL(key + '.html', root), html);
}

for (const page of pages) {
  let html = await readFile(new URL(page.file, root), 'utf8');
  if (page.path === '/') page.structured = { '@context': 'https://schema.org', '@graph': [organization(), { '@type': 'WebSite', '@id': canonical('/#website'), name: SITE.name, url: canonical('/'), inLanguage: ['en', 'id'], publisher: { '@id': canonical('/#organization') } }] };
  html = metadata(html, page);
  if (!html.includes('data-policy-links')) html = html.replace(/<\/footer>/i, () => links + '</footer>');
  if (!html.includes('public-settings.js')) html = html.replace(/<\/body>/i, '<script src="/public-settings.js?v=20261025-socials-1"></script></body>');
  await writeFile(new URL(page.file, root), html);
}
await writeFile(new URL('robots.txt', root), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dev/\nDisallow: /backend/\nDisallow: /supabase/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);
