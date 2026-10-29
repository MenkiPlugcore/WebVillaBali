// Accept Google Maps share links without resolving or guessing a property's pin.
export function googleMapsURL(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(raw)) return '';
  try {
    const url = new URL(raw), host = url.hostname;
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    const google = /^(?:www\.)?google\.(?:com|co\.id)$/.test(host) && /^\/maps(?:\/|$)/.test(url.pathname);
    const maps = /^maps\.google\.(?:com|co\.id)$/.test(host);
    const short = host === 'maps.app.goo.gl' && /^\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname);
    const legacy = host === 'goo.gl' && /^\/maps\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname);
    return google || maps || short || legacy ? url.href : '';
  } catch { return ''; }
}

export function normalizeMapsURL(value) {
  const raw = String(value ?? '').trim(), url = googleMapsURL(raw);
  if (raw && !url) throw Error('Gunakan link Bagikan dari Google Maps, misalnya https://maps.app.goo.gl/... atau https://www.google.com/maps/...');
  return url;
}
