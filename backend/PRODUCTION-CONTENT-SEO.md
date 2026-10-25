# Website policies, content and SEO — 25 October 2026

## Published scope

- Privacy, website/booking terms, and cancellation/refund request information in English and Indonesian, linked from public footers and inquiry forms.
- Policies describe the implemented inquiry/invoice flow, functional browser storage and external services. They do not invent a legal entity, address, contact, fixed refund deadline, cancellation fee or deposit percentage.
- The example customer quotations and five-star ratings were replaced with three factual guidance cards. The approved mobile carousel is retained; no review or aggregate-rating structured data is published.
- Stale concept/demo copy was removed from active pages. Motorbike equipment, availability, prices and booking conditions remain listing-specific and subject to confirmation.
- The clearly identified test listing `tesproperty` was moved from published to draft through the connected database tool. No property record or media was deleted. The pre-existing `testing2` draft was left unchanged.

## Canonical host and content generation

The working host is `https://webvillabali.menkiestes.workers.dev`. Both `agungubudproperty.com` and `www.agungubudproperty.com` returned HTTP 503 during this change, so canonical URLs do not point visitors or crawlers to an unavailable host.

`seo/config.js` is the canonical origin and route configuration. After the owner connects the final domain, change `SITE.origin`, run `node backend/build-public.mjs`, review and redeploy the generated HTML and robots file, then verify redirects and submit the final sitemap in the owner's Search Console account. Do not use a request Host header to construct canonical URLs.

`backend/policy-content.js` contains the bilingual policy text. `node backend/build-public.mjs` generates the three policy pages, public metadata and robots file. Commit generated output with source changes. The generator is idempotent.

## Runtime SEO

The small Worker runs first only for `/sitemap.xml`, `/property`, its legacy variants, and `/properties/*`. Existing staff routes and static assets retain asset-first serving. It reads only the existing anonymous public catalogue endpoint, with no staff token or private database key.

- The sitemap discovers currently published property slugs on each request and excludes personal lists, staff panels and the currently empty guest gallery. It stops on a failed or incomplete catalogue instead of publishing a false partial sitemap.
- Property HTML includes the published title, description and summary before browser JavaScript runs. Client rendering still supplies galleries, language changes and inquiry forms.
- Missing/withdrawn properties return HTTP 404; upstream failures return retryable HTTP 503. Neither response is indexed. Legacy links redirect to the canonical property URL.
- HTML and JSON-LD escape untrusted listing content. Worker responses explicitly include security headers because static `_headers` rules do not cover generated responses.
- Saved/comparison pages, the generic property shell and the empty guest gallery use noindex. Staff noindex and access protections remain in place.

## Owner follow-up

The owner still supplies business contact/identity details, confirms retention and operational privacy arrangements with service providers, and sets the exact deposit/cancellation/refund terms for each transaction before payment. Populate genuine customer reviews only with permission. Revisit guest-gallery indexing when real permitted content is available.

PayPal remains deferred and its existing issue/payment block remains intact. No data or media backup work is included; source code remains in GitHub.

## Primary references

- Indonesian personal data protection law: https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang%2Bnomor%2B27%2Btahun%2B2022
- Canonical URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Worker routing: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- Generated-response security headers: https://developers.cloudflare.com/workers/static-assets/headers/
