# Agung Ubud Property backend foundation

Project: `tvcmwkzwemrwwewphfgh` (Cancan, Singapore).

The approved public frontend remains unchanged. This branch stores the initial database migration. No demo content or customer accounts are seeded.

## Roles and access

Assign `app_metadata.aup_role` only through a trusted server/Auth admin action:

- `owner`, `admin`: content, settings and private inquiry management.
- `editor`: content management; no access to inquiries or website settings writes.
- Ordinary authenticated users and visitors: published content only.

Never use user-editable `user_metadata` for permissions. Role changes require refreshing the user's token; revoking a role requires managing existing sessions too.

## Next integration steps

1. Create the first owner's Auth account after confirming the intended email address; send an invite rather than sharing a password.
2. Build `/admin` login and editing screens and verify role checks before integrating public pages.
3. Create private Storage buckets via the Storage API and bind object policies to published content records. Draft media must remain private.
4. Implement a Cloudflare Worker inquiry endpoint with input validation, abuse protection, and server-side credentials. Database inquiry writes are intentionally not public.
5. Connect the catalog, rental page and public content to published database records.

Keep API secrets out of browser code, git and public settings. Use Cloudflare secret bindings. Store only public business contact information in `site_settings`.

## Verification

Migration `20261007070102_aup_backend_foundation` was applied to the project. Ten public tables have RLS enabled. `supabase/tests/aup_access.sql` verifies published-only public reads (including images), denied public writes, rejection of user metadata role escalation, editor restrictions, owner inquiry access, publication consent and update triggers. All fixtures roll back.

Supabase security advisor returned no findings. Performance advisor reports only [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), expected for this empty database; retain indexes for foreign keys and planned catalog/inquiry queries and review after real traffic.
