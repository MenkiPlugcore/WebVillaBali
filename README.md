# Agung Ubud Property — Concept Preview

Premium property marketplace concept for the working domain `AgungUbudProperty.com`.

This repository is intentionally build-free so the preview can be deployed to Cloudflare Pages immediately.

## Demo scope

- Premium responsive landing page
- Villa, house, land, rental, and commercial property catalogue
- Property type filter
- Location/type/purpose search
- Property detail modal
- English / Indonesian language toggle
- USD / IDR display toggle
- Manual inquiry demo
- Manual PayPal flow placeholder
- Location, services, about, and contact sections
- Mobile-first responsive layout

## Important

This is a **sales / concept preview**, not the final production system. Property data, pricing, contact details, payment handling, brand assets, logo, legal copy, and images are placeholders until the client confirms the final requirements.

## Deploy to Cloudflare Pages

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select `MenkiPlugcore/WebVillaBali`.
4. Framework preset: **None**.
5. Build command: leave empty.
6. Build output directory: `/` (repository root) if requested; otherwise leave the default for static deployment.
7. Deploy.
8. After the preview is approved, connect the final custom domain.

No environment variables are required for this concept preview.

## Production roadmap

The production version can later add Supabase-backed property management, admin authentication, image storage, inquiry management, real WhatsApp/email delivery, CRM integration, PayPal payment instructions or API integration, SEO pages, analytics, property status, favourites, and role-based staff access.

## Credits

Project: Agung Ubud Property concept  
Development: CADERA / MENKIESTES

## License

Licensed under the custom **MENKIESTES SOFTWARE LICENSE v1.0**. See `LICENSE`.
