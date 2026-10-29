import { SITE } from './config.js';
import {googleMapsURL} from '../map-links.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const jsonLD = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
export const canonical = path => SITE.origin + path;
export const organization = () => ({ '@type': 'Organization', '@id': canonical('/#organization'), name: SITE.name, url: canonical('/'), logo: canonical(SITE.logo) });

export function metadata(html, page) {
  const url = canonical(page.path), image = page.image || canonical(SITE.logo);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHTML(page.title)}</title>`)
    .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\bid=["']siteStructuredData["'])[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/[ \t]+$/gm, '');
  const graph = page.structured || { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url, isPartOf: { '@id': canonical('/#website') } };
  const tags = `\n<meta name="description" content="${escapeHTML(page.description)}">\n<meta name="robots" content="${page.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">\n<link rel="canonical" href="${escapeHTML(url)}">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="${SITE.name}">\n<meta property="og:title" content="${escapeHTML(page.title)}">\n<meta property="og:description" content="${escapeHTML(page.description)}">\n<meta property="og:url" content="${escapeHTML(url)}">\n<meta property="og:image" content="${escapeHTML(image)}">\n<meta property="og:image:alt" content="${escapeHTML(page.imageAlt || SITE.name)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${escapeHTML(page.title)}">\n<meta name="twitter:description" content="${escapeHTML(page.description)}">\n<meta name="twitter:image" content="${escapeHTML(image)}">\n<script id="siteStructuredData" type="application/ld+json">${jsonLD(graph)}</script>\n`;
  return html.replace(/\s*<\/head>/i, () => tags + '</head>');
}

export function propertyPage(row) {
  const title = String(row.title_en || row.title_id || SITE.name).slice(0, 200);
  const description = String(row.description_en || row.description_id || `Ask our team about ${title} in Bali.`).replace(/\s+/g, ' ').slice(0, 160);
  const path = '/property?slug=' + encodeURIComponent(row.slug);
  const imageId = row.property_images?.find(image => /^[0-9a-f-]{36}$/i.test(image.id))?.id;
  const image = imageId ? SITE.catalog + '?image=' + encodeURIComponent(imageId) : canonical(SITE.logo);
  return { title: title + ' | ' + SITE.name, description, path, image, imageAlt: title, index: true,
    structured: { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: title, description, url: canonical(path), image, inLanguage: 'en', publisher: { '@id': canonical('/#organization') } }
  };
}

export function propertySummary(row) {
  const mapsURL = googleMapsURL(row.maps_url);
  const title = row.title_en || row.title_id || SITE.name;
  const description = row.description_en || row.description_id || 'Contact our team for details.';
  const page = propertyPage(row);
  const facts = [row.locations?.name || 'Bali', row.property_type, row.purpose === 'sale' ? 'For sale' : 'For rent'];
  for (const [field, label] of [['bedrooms', 'bedrooms'], ['bathrooms', 'bathrooms']]) if (Number.isInteger(row[field]) && row[field] > 0) facts.push(`${row[field]} ${label}`);
  const price = row.price == null ? 'Price on request' : new Intl.NumberFormat(row.currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency: ['IDR', 'USD'].includes(row.currency) ? row.currency : 'IDR', maximumFractionDigits: row.currency === 'IDR' ? 0 : 2 }).format(Number(row.price));
  const period = row.price == null ? '' : ({ night: '/ night', day: '/ day', month: '/ month', year: '/ year' })[row.price_period] || '';
  return `<div class="shell"><section class="detail-hero"><div class="detail-image"><img src="${escapeHTML(page.image)}" alt="${escapeHTML(title)}" fetchpriority="high" decoding="async"></div><div class="detail-summary"><p class="detail-kicker">${facts.map(escapeHTML).join(' · ')}</p><h1>${escapeHTML(title)}</h1><p class="detail-description">${escapeHTML(description)}</p><div class="detail-price"><strong>${escapeHTML(price)}</strong><small>${escapeHTML(period)}</small></div><p>Availability, rates and booking conditions are confirmed by our team before payment.</p><a class="primary-btn dark-btn" href="/#contact">Ask about this property</a>${mapsURL?`<p><a class="detail-map-link" href="${escapeHTML(mapsURL)}" target="_blank" rel="noopener noreferrer">View location on Google Maps ↗</a></p>`:''}</div></section></div>`;
}
