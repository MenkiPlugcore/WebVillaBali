# Agung Ubud Property backend foundation

Project: `tvcmwkzwemrwwewphfgh` (Cancan, Singapore).

The approved public frontend remains unchanged. This branch stores the initial database migration. No demo content or customer accounts are seeded.

## Roles and access

Assign `app_metadata.aup_role` only through a trusted server/Auth admin action:

- `owner`, `admin`: content, settings and private inquiry management.
- `editor`: content management; no access to inquiries or website settings writes.
- Ordinary authenticated users and visitors: published content only.

Never use user-editable `user_metadata` for permissions. Role changes require refreshing the user's token; revoking a role requires managing existing sessions too.

## Admin panel

`/admin/` is a mobile-first Indonesian admin panel with password login, per-tab session storage, server-verified staff roles, paginated/searchable cards and content editing. Database writes use the signed-in user's token and RLS. Editors cannot open settings or inquiries. The temporary admin account was provisioned separately; no credentials are stored in the repository.

Manage properties (including kos), motorbikes, locations, services, testimonials, guest moments, public business settings and inquiry status/internal notes. Content can be drafted, published or archived. Photo uploads support JPEG/PNG/WebP up to 8 MB. The `admin-media` Edge Function has JWT verification enabled and independently verifies the user and trusted app metadata. It provisions the private `aup-media` bucket through the Storage API on first upload, authorizes parent records using the caller's RLS, and issues five-minute signed URLs for staff previews. Direct public Storage access is not granted. Guest moments require a real uploaded photo and confirmed consent before publication.

`npm ci --ignore-scripts && npm run build:admin` rebuilds the checked-in static bundle. Dependencies are pinned in `package-lock.json`; hosting needs no build command. Run `npm test` for input, role, upload authorization and cleanup tests. Changing domains requires updating the Edge Function's origin allowlist and redeploying it.

## Remaining integration steps

1. Transfer admin access to the owner's verified account when supplied; revoke the temporary admin role and existing sessions when appropriate.
2. Implement a Cloudflare Worker inquiry endpoint with input validation, abuse protection, and server-side credentials. Database inquiry writes are intentionally not public.
3. Connect the rental page, services, testimonials, guest moments and public business settings to published database records.

Keep API secrets out of browser code, git and public settings. Use Cloudflare secret bindings. Store only public business contact information in `site_settings`.

## Verification

Migration `20261007070102_aup_backend_foundation` was applied to the project. Ten public tables have RLS enabled. `supabase/tests/aup_access.sql` verifies published-only public reads (including images), denied public writes, rejection of user metadata role escalation, editor restrictions, owner inquiry access, publication consent and update triggers. All fixtures roll back.

The database security advisor initially returned no findings. After account provisioning, it reports [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); Supabase restricts this option to Pro and above, while this project uses Free. No paid upgrade was made. Performance advisor reports only [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), expected for this empty database; retain indexes for foreign keys and planned catalog/inquiry queries and review after real traffic.

## Live property catalog

The homepage catalog, kost teaser, universal `/property?slug=...` detail page, saved listings and comparison now read published properties from `public-catalog`. Old `/properties/<slug>.html` URLs use the same live detail view and show unavailable when no published record exists. Empty catalogs and network failures are explicit; sample properties are never used as a fallback. English/Indonesian fields, new slugs, active location names, facilities, availability and photo galleries are supported. Prices retain each listing's stored currency and period. The USD/IDR selector chooses the currency for optional price filters; no invented exchange rate is used.

The read-only public Edge Function has gateway JWT verification disabled. All database reads use the server's anonymous key and explicit published filters, regardless of caller tokens. The image route accepts a photo UUID, verifies both the image and its published parent through anonymous RLS, then signs only its database-owned private Storage path for five minutes. Responses and redirects have `Cache-Control: no-store`; a signed URL already issued can remain usable until it expires. Drafts and archived media are never signed through this endpoint. No secret key or storage path is returned by the listing endpoint.

Properties are fetched in stable pages of 100; the browser loads all pages so existing location/type/bedroom/price filters operate over the full catalog. This is appropriate for the initial inventory. Very large inventories should move filtering/pagination into the endpoint rather than preloading all metadata. The public inquiry form remains explicitly a demo; submitting it does not save an inquiry. The admin's real-user draft/save/photo smoke test succeeded on 2026-10-07. `npm test` also checks public authorization, draft image denial, short-lived published image signing, pagination, hostile content, empty/error states, detail galleries, saved and comparison behavior.

Cloudflare canonicalizes `.html` URLs to extensionless paths. The slug parser supports both canonical and legacy paths, including optional trailing slashes, so redirects do not lose the selected listing.
