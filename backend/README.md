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
2. Connect testimonials to published database records (deferred by the owner).

Keep API secrets out of browser code, git and public settings. Supabase Edge Functions use server environment secrets. Store only public business contact information in `site_settings`.

## Verification

Migration `20261007070102_aup_backend_foundation` was applied to the project. Ten public tables have RLS enabled. `supabase/tests/aup_access.sql` verifies published-only public reads (including images), denied public writes, rejection of user metadata role escalation, editor restrictions, owner inquiry access, publication consent and update triggers. All fixtures roll back.

The database security advisor initially returned no findings. After account provisioning, it reports [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); Supabase restricts this option to Pro and above, while this project uses Free. No paid upgrade was made. Performance advisor reports only [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), expected for this empty database; retain indexes for foreign keys and planned catalog/inquiry queries and review after real traffic.

## Live property catalog

The homepage catalog, kost teaser, universal `/property?slug=...` detail page, saved listings and comparison now read published properties from `public-catalog`. Old `/properties/<slug>.html` URLs use the same live detail view and show unavailable when no published record exists. Empty catalogs and network failures are explicit; sample properties are never used as a fallback. English/Indonesian fields, new slugs, active location names, facilities, availability and photo galleries are supported. Prices retain each listing's stored currency and period. The USD/IDR selector chooses the currency for optional price filters; no invented exchange rate is used.

The read-only public Edge Function has gateway JWT verification disabled. All database reads use the server's anonymous key and explicit published filters, regardless of caller tokens. The image route accepts a photo UUID, verifies both the image and its published parent through anonymous RLS, then signs only its database-owned private Storage path for five minutes. Responses and redirects have `Cache-Control: no-store`; a signed URL already issued can remain usable until it expires. Drafts and archived media are never signed through this endpoint. No secret key or storage path is returned by the listing endpoint.

Properties are fetched in stable pages of 100; the browser loads all pages so existing location/type/bedroom/price filters operate over the full catalog. This is appropriate for the initial inventory. Very large inventories should move filtering/pagination into the endpoint rather than preloading all metadata. Public contact, property and rental forms now create private tickets through `public-inquiry`. Visitors receive a stable AUP ticket number; owner/admin manage status and internal notes under Tiket pelanggan, and can search by ticket number. Ticket numbers cannot be changed. No public ticket lookup or automatic email is enabled. The admin's real-user draft/save/photo smoke test succeeded on 2026-10-07. `npm test` also checks public authorization, draft image denial, short-lived published image signing, pagination, hostile content, empty/error states, detail galleries, saved and comparison behavior.

Cloudflare canonicalizes `.html` URLs to extensionless paths. The slug parser supports both canonical and legacy paths, including optional trailing slashes, so redirects do not lose the selected listing.

## Inquiry tickets and rental

`public-catalog?kind=motorbike` reads published motorbikes and signs only their verified private images. The rental form uses database prices and availability. Booking requests require manual team confirmation; submitting a ticket does not reserve inventory or charge money.

`public-inquiry` validates bounded JSON and published references, uses a honeypot and durable contact/global quotas, and calls a service-role-only SECURITY INVOKER RPC. Anonymous and ordinary authenticated users cannot read or insert inquiries directly. Customer contact hashes are server HMACs; raw IPs are not retained. Identical retries reuse the same ticket for two days, with conflicting payloads rejected. Client success appears only after database commit; network failures preserve the form. Status and internal notes are never accepted from public payloads. SQL fixtures roll back.

The private quota/request tables intentionally enable RLS without client policies and grant access only to service_role; the advisor reports this as informational.

## Public business contact settings

The homepage and rental footer read `public-catalog?kind=settings` using anonymous RLS. The endpoint filters contact/social keys and returns only validated email, phone, WhatsApp, address and official HTTPS social links. Admin normalizes Indonesian 08 numbers to 628 and rejects invalid contacts/links before saving. The homepage floating button updates after settings load, so it cannot remain stuck in the ticket fallback due to response timing. Blank/invalid settings and outages use the inquiry ticket form instead of an invented business number or email. Reloading a public page reads fresh settings; no realtime subscription is required. Brand and homepage copy settings are still pending integration.

## Published services and service tickets

`public-catalog?kind=service` uses anonymous published-only reads with stable sort/id ordering and pages of 100. Live service cards replace sample construction/permit cards, populate the mobile menu and contact-form choices, and preserve typed customer messages when changing language. Empty and failed catalogs show explicit states without sample fallback. The inquiry endpoint verifies the published service, prefixes the database title, and records the service_id. The service-only reference check also runs atomically in the service-role-only intake RPC; draft or archived services return 404. `supabase/tests/service_inquiry.sql` verifies anonymous visibility, published ticket references, retry ticket stability and draft/archive rejection, with fixtures rolled back.

## Published guest documentation

`public-catalog?kind=guest` returns published, consent-confirmed moments in pages of 20 with stable sort/id ordering. Only the record UUID and public captions/location are returned; private Storage paths are excluded. `kind=guest&image=<uuid>` checks the published record and consent anonymously before signing its database-owned guest path for five minutes. The bucket stays private, and responses are no-store. Previously issued signed URLs can remain usable until expiry after a moment is archived.

Homepage shows the first six photos; the dedicated gallery loads more on demand. English/Indonesian captions, safe text rendering, a keyboard-accessible photo dialog and explicit empty/retry states replace all sample guest imagery. Mobile uses a single column. Admin Momen tamu → Tambah foto uploads a draft; select Terbit with consent confirmed to publish, or Arsip to hide it. No guest photos or reviews are seeded.

Ticket cards and detail forms now display the inquiry type and associated property/motor/service title. Status and internal notes are the only editable customer-ticket fields. Rollback SQL verifies three ticket types, stable retries, admin processing and denied editor/customer reads. These checks leave existing customer tickets untouched.

## Staff dashboard

The admin panel opens on Ringkasan after login. Owner/admin see exact counts for new tickets, tickets in progress, published properties and published/available motorbikes. Editors only query content counts. Each count uses a HEAD query with the signed-in user's RLS and a 15-second timeout; no customer records are downloaded for summary statistics. Unavailable counts display a dash with a retry action instead of a false zero. There is no public summary endpoint or schema/permission change.

Cards open the matching filtered list, including both publication and availability for motorbikes. Refresh reads current counts, stale responses cannot overwrite another section, and unsaved-edit navigation guards are retained. The responsive grid uses two columns on phones and one on very narrow screens. Notifications remain a separate future update.


## Stage 1 security audit — 11 October 2026

See SECURITY-AUDIT-2026-10-11.md for findings, verification and remaining actions. Staff RLS now checks the current Auth user role and the caller's active session via a narrow private helper; JWT role metadata alone does not grant access. The panel and admin-media also call the caller-scoped staff_access RPC. Explicit logout revokes server sessions globally. Authenticated ticket updates are limited to status/internal_notes; server intake alone creates inquiries. New migrations match the versions applied to production. Public signup is disabled and verified. Admin MFA remains a pre-handover action.

## Stage 2 property management — 11 October 2026

The property form now groups identity, location, price/tenure, specifications/facilities and publication/availability into accessible native details sections. Invalid controls open their section. Price preview never changes the saved numeric value; facility shortcuts preserve custom entries. Property and motorbike lists expose availability filters/badges.

Property and motorbike galleries support cover selection and left/right ordering on touch devices. Changes save immediately, separately from the property form. New uploads append to the saved order. The caller-authorized SECURITY INVOKER manage_gallery RPC atomically switches the unique cover, validates a full nonduplicated parent-specific order, and selects a replacement cover when the previous cover is removed. It serializes mutations per parent and retains RLS plus live-role/session checks. Anonymous/customer/revoked accounts are denied. Metadata removal is reported separately from a failed private-file cleanup; no false failure suggests the gallery record still exists.

Verification: automated panel/gallery/endpoint tests, SQL rollback fixtures for properties and motorbikes, caller JWT rather than service privilege for metadata RPC, and existing published-only public catalog checks. Authenticated browser testing still requires a legitimate staff login.

## Stage 3 — ticket follow-up

Ticket details load the current database row when opened. Owner/admin can open a validated WhatsApp, telephone or email link and copy the ticket number; messages are sent manually and opening a link does not change the ticket status. Context-specific guidance explains each status, including reopening a completed ticket. Internal notes remain private.

Saving uses id plus the original updated_at filter and checks that exactly one row was returned. A stale save does not overwrite another admin’s changes: unsaved notes remain visible, with a guarded reload action. Navigation waits for active saves; returning to the list preserves search/status filters. The database’s existing update timestamp trigger and staff RLS enforce the underlying access. No new public ticket lookup or extra staff grants were introduced.

A successful public inquiry keeps its ticket receipt even if a post-success UI callback fails. Tests cover duplicate submit suppression, same-request retry, honest network failure, status/notes-only writes, safe contact links and stale-write detection. Rollback database fixtures verify property/motor/service references, ticket idempotency, quota enforcement, processing through closure/reopening, conditional-write conflicts and denied editor/customer access. Automated checks do not replace a final hands-on test in the owner’s mobile session.

## Stage 4 — device and load optimization

Hero images request 900px/q75 at viewport widths up to 700px and 1800px/q80 on larger screens, replacing the previous 2200px/q90 requests. The slideshow only initializes the first background and loads subsequent photos on demand before revealing them. Rotation pauses outside the viewport, in a hidden tab, with reduced motion, or when the browser reports Save-Data. Eight static category/location/about backgrounds wait until within 350px of the viewport; browsers without IntersectionObserver load them immediately.

Concurrent motor catalog calls share the in-flight request, then clear the promise so later reads revalidate availability. Gallery images decode asynchronously. Public form fonts, focus states, menu scrolling, touch targets, and the admin sticky save bar are adjusted for narrow screens and safe areas. Catalog publication checks, no-store API responses and private admin permissions are unchanged. No persistent client cache stores ticket/customer data.

Verification includes behavioral tests for lazy background requests, hero loading/pause/reduced-motion behavior and fleet deduplication/retry. These are request-count and configuration improvements; no synthetic Lighthouse score or real-device speed percentage is claimed. Private uploaded originals still require a separate image-size optimization strategy as inventory grows.

## Stage 5 — mandatory staff MFA (2026-10-11)

The admin panel now gates staff data behind TOTP verification. First login offers QR or manual-secret enrollment for use on the same phone; later password-only sessions show the code challenge. Backend staff access additionally requires JWT/session aal2 and a currently verified TOTP factor, while retaining live role, ban, expiry and revocation checks. MFA setup is performed by the real staff member, not the agent. Actual enrollment and authenticated phone testing are pending.

83 automated tests passed, including password-only/stale-factor denial, enrollment/retry/secret cleanup and no private reads before MFA. Six SQL regression files passed against production using rollback fixtures. Migration: `20261011155814_staff_mfa_required.sql`. Frontend deployment is live.

Backup and isolated restore remain pending: connected tools do not supply backup downloads or protected database connection credentials. `RECOVERY-RUNBOOK.md` documents Auth recovery, separate database/photo exports, off-site encryption and the isolated drill. No backup schedule or paid plan was enabled. Stage 5 is not complete until real staff enrollment and backup/restore verification succeed.

## Developer entry — 2026-10-12

`/dev/` uses the same bundled business panel as `/admin/`, a dedicated developer role and a separate `aup-dev-session` storage key. Developer logout revokes only the current session; no owner credentials are shared. The existing temporary account `menkiestes@gmail.com` is designated for developer access. MFA enrollment remains an action performed by each account holder.

Developer grants are checked live by the common backend staff helper along with MFA, session validity and current role. Revoking/expiring a grant denies staff-only data and writes even with an old JWT. Published public content remains public. With the shared-panel migration, owner and active developer roles use the same management menus, employee creation and Editor/Admin role controls, activity history, and controls for other developer grants. A developer cannot change its own grant. Employee management cannot change owner/developer identities or create those privileged roles. MFA, live session checks and the explicit revocable developer grant remain mandatory.

Append-only `staff_activity` records actor UUID, role, session, action, table, record key and timestamp for business changes and grant updates. It excludes row values, customer messages/notes and authentication secrets. Logs start at deployment; no historical changes were reconstructed. Owner and active developer can read the management activity across accounts; action records retain the actual actor role and identity. This is a database change journal, not a complete access/login audit or backup. Backend service credentials remain a trusted boundary and are not placed in the browser.

Validation: 89 automated tests; developer rollback SQL for MFA, business writes, owner-only grant management, immediate revocation/expiry, no self-grant, audit attribution/isolation and anonymous denial; four existing SQL regression suites also passed. Admin media function version 4 includes the developer role with unchanged live backend authorization. Existing advisor warning about leaked-password protection remains: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

Migration: `20261012072835_developer_portal_and_staff_activity.sql`. Authenticated live-phone testing and backup/restore work remain pending.

### Remembered staff sessions

The owner and developer login pages offer an unchecked “Tetap masuk di perangkat ini” option for private devices. The storage adapter persists only after fresh user, MFA AAL2 and live staff access checks succeed. The retained session expires after seven days without extending its deadline during token refresh. Passwords and authenticator secrets are never retained by this feature. Fresh sign-in after logout still requires MFA. Blocked browser storage falls back to the current tab.

`aup_private.current_staff_role()` also limits every staff session to seven days from its server creation time, including sessions kept open in a tab. Browser state cannot extend this limit. Revoked sessions, roles, developer grants and verified factors remain checked on the server. Owner and developer storage keys remain separate. The SQL rollback suite covers the seven-day boundary and existing role/session revocation checks.

### Employee accounts

Owner in `/admin/` and developer in `/dev/` can open **Tim & akses** to assign an existing Supabase Auth account as Editor (content publishing) or Admin (content, customer tickets, website settings), change its role, or disable/re-enable its access. Both management roles can choose “Buat akun baru” to provision an employee from the panel. The server creates an unconfirmed Auth account, records the request, then issues a one-time activation link for the requesting manager to share privately. No email is sent automatically, and no SMTP configuration is required. Existing accounts can still be assigned a role using “Gunakan akun terdaftar”. No shared owner credentials are needed.

The management RPC checks the live owner/developer role, MFA, session age and validity before returning any employee details or changing access. It cannot change the caller, owners, developers or special roles, or grant owner/developer roles. It preserves unrelated app metadata and records access changes in the shared management activity log, attributed to the actual owner/developer actor. Session creation must follow the latest role/status change; token refresh and later reactivation cannot revive an earlier staff session. Normal MFA and the seven-day staff-session limit still apply. The employee list is limited to 200 entries.

### Management provisioning and staff activation

`admin-staff` verifies the caller with Auth, then calls management RPCs using the caller JWT. The database rechecks the live owner/developer role, AAL2, the verified factor, active session, and seven-day/session-revocation limits. Requests allow only Editor/Admin, are bound to the requesting manager and target account, expire after five minutes, and are limited to five per minute and ten per hour. Existing emails cannot be overwritten by account creation. The service key is used only inside the Edge Function for Auth Admin API calls; it never enters browser code. Provisioning requests, including failures, remain private; completion adds account-ID metadata to the existing audit log. A failure after account creation is reported as partial success so the manager can generate a new link from its card.

Manager-created accounts start unconfirmed, with an automatically generated unknown password. The staff member opens `/admin/activate/`, explicitly verifies the invite/recovery token, chooses a password of at least 12 characters, then signs in normally and enrolls MFA. Activation uses an isolated in-memory Auth client, leaves owner/developer sessions untouched, and never grants AAL2. Tokens are returned only to the authorized requesting manager, placed in URL fragments, removed from the visible URL/history on load, and are never saved in browser storage, application logs, or database records. The requesting manager must share links privately; the app does not send messages.

An active employee with no verified MFA can receive a new setup link. An unconfirmed account uses invite verification; a confirmed account whose setup was interrupted uses recovery verification. Verified MFA, disabled employees, owner/developer accounts, and other roles block this setup-link endpoint. Existing MFA is never reset. No real employee accounts are created by automated tests.

### Shared panel proposal — 2026-10-23

Migration `20261022183311_unified_owner_developer_panel.sql` and the corresponding `admin-staff` handler enable the shared management permissions described above. The `/admin/` and `/dev/` entry points retain separate role admission, session storage and account MFA; neither entry impersonates the other account. The older validation notes above describe earlier releases.

Validation: 127 application tests passed and the static bundles built. `supabase/tests/shared_panel.sql` adds rollback checks for developer employee provisioning, actor-bound requests, audit attribution and visibility, protected owner/developer identities, denied employee access, MFA, self-grant prevention, and immediate revocation. All seven rollback SQL suites passed against the production database: shared panel, staff management, staff provisioning, revocation, gallery management, public access, and developer portal. Fixtures were rolled back; no employee activation credentials or real invitations were generated.

**Release authorization:** the user explicitly approved production developer management rights on 2026-10-23: employee creation/management, all management activity, and access controls for other developer accounts. The production migration is applied and `admin-staff` version 2 is deployed with JWT verification enabled. Owner and developer credentials remain separate. Publishing the matching bundles follows the verified backend rollout; real-account employee activation remains a user smoke-test step.
