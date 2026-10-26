# Agung Ubud Property

Bali property, long-stay and motorbike rental website with a Supabase-backed staff panel, inquiry tickets and invoice administration.

Live website: https://webvillabali.menkiestes.workers.dev/

## Current features

- Responsive English/Indonesian catalogue, saved properties, comparison, galleries and inquiry forms.
- Owner/staff access with MFA, property publication controls and customer ticket management.
- Ticket-linked invoices, print/PDF, manual BCA verification and payment audit history.
- Bilingual privacy, website/booking terms and cancellation/refund request pages.
- Public metadata, canonical URLs and structured data; a dynamic sitemap and server-rendered published property summaries.

PayPal checkout is implemented and remains inactive until the owner connects the business Sandbox or Live credentials in Metode pembayaran. BCA uses manual transfer verification; its default account is configured there too. Owners supply business identity/contact details and the specific commercial conditions for each transaction. Only genuine, permitted customer reviews should be presented as reviews.

## Development and deployment

The public frontend uses plain HTML, CSS and JavaScript. A small Cloudflare Worker handles the sitemap and property SEO routes; all other paths retain static asset serving. Supabase provides the existing public catalogue, inquiries and staff services.

```sh
npm ci
npm test
node backend/build-public.mjs
```

Rebuild admin bundles only when changing staff application source with `npm run build:admin`. Public content changes do not require rebuilding the admin panel.

GitHub changes deploy through Cloudflare Workers Builds. `wrangler.jsonc` defines the Worker and static asset binding. `.assetsignore` excludes backend code, tests, dependencies and credentials from static serving.

`seo/config.js` contains the canonical origin. The custom `.com` domain must be connected and verified before switching that origin and regenerating public files. See [production content and SEO notes](backend/PRODUCTION-CONTENT-SEO.md).

Source code is retained in GitHub. Data/photo/video backup work is outside the current agreed scope.

## Further documentation

- [Backend setup and feature history](backend/README.md)
- [Invoice operation and limits](backend/INVOICES.md)
- [Policies, content, SEO and owner follow-up](backend/PRODUCTION-CONTENT-SEO.md)

Development: CADERA / MENKIESTES. Licensed under the custom MENKIESTES SOFTWARE LICENSE v1.0; see `LICENSE`.
