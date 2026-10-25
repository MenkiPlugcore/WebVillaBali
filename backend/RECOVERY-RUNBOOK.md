# MFA and recovery — Agung Ubud Property

## Deployment state

Mandatory staff TOTP MFA is implemented. Actual enrollment must be done by each staff member from their own login; this repository contains no authenticator secrets or recovery codes. No staff factor was enrolled by the agent.

**Database backup, photo backup, off-site encryption and an isolated restore drill are NOT completed.** The connected tools do not provide database connection credentials or a backup download operation. A schema migration or this GitHub repository is not a backup of customer data or uploaded photos.

## Staff setup and lost authenticator

1. Sign in at `/dev/` for the dedicated developer account, or `/admin/` for owner/admin/editor, with the registered email/password.
2. Select “Siapkan authenticator”. Scan the QR or add the displayed secret manually on the same phone. Enter the current six-digit code.
3. Store an encrypted authenticator backup separately from the phone. Do not send the QR, secret, password or codes in chat. TOTP has no application-generated recovery codes in this implementation.
4. Verify a fresh browser sign-in requires a code, then verify logout. On 17 October 2026, the user confirmed enrollment/login, logout and a fresh MFA sign-in work on their device. This is user-reported acceptance testing.
5. Protect the Supabase dashboard owner account with its own MFA and recovery options as well. Dashboard access is a separate account from website staff login.

If the authenticator is lost, the verified project owner can use Supabase Auth user management to remove the affected factor after an independent identity check. Revoke that user's sessions. The user signs in again and enrolls a replacement; mandatory MFA is never disabled. Record who approved the reset and when. If the dashboard owner is also locked out, use Supabase's account recovery/support process rather than weakening database policies.

Backend staff checks require current app metadata role, a live unexpired session, `aal2` in both JWT and session, and a currently verified TOTP factor. No browser toggle bypasses this. Service-role credentials remain a trusted backend privilege and must never enter the panel.

## Database backup — owner-controlled trusted machine

Current official guidance recommends regular CLI exports for Free projects. Storage objects are excluded from database backups.

1. Obtain the project's database connection URL through the Supabase dashboard Connect dialog on a trusted machine. Keep the password in a protected environment/secret manager, never Git or chat. Install supported Supabase CLI and its dump prerequisites.
2. Follow the official backup/restore guide below to export **roles, schema and data**. Explicitly include the application schemas `public` and `aup_private`. Confirm the output contains functions, policies, grants, custom ticket sequence and all application tables. The default schema export skips managed Auth/Storage definitions. Check the data dump separately for Auth and Storage records; application-only exports cannot restore staff identities, MFA state or bucket configuration.
3. Separately follow the official managed Auth/Storage migration instructions if full project reconstruction is required. Do not assume ordinary `db dump` includes those. Record Auth settings, signup disabled, redirect URLs, MFA enforcement, bucket configuration, deployed Edge Functions, public keys and secret names (not plaintext secrets).
4. Encrypt exports, copy them to an owner-controlled off-site location, calculate checksums and record completion time, PostgreSQL/CLI versions and inventory counts. Backup failure must be visible to an operator. Target daily backups and before major migrations; these are targets, not an active schedule.

## Uploaded photos

Export original bytes for every object in the private media bucket with a trusted server-side Storage client. Paginate recursive listings, download every file, and retain bucket name, full object path, byte size and checksum in a protected manifest. Include photo table references and guest consent metadata. Store encrypted off-site with the database snapshot. Never make the private bucket public to obtain a backup. Source migrations include bucket setup, but not uploaded object bytes.

## Isolated restore drill (required before marking recovery complete)

Use a separate empty test project, never production. Restore roles/schema/data following the official sequence. Recreate Auth/Storage configuration and restore object bytes through the Storage API. Deploy Edge Functions and set test secrets; keep WA/email/payment integrations disabled and omit production webhook credentials.

Verify counts and representative records for properties, locations, images, motorbikes, services, guest moments, inquiries and settings; all photo paths/checksums; guest consent visibility; ticket numbers and sequence; schema migrations; staff login/MFA; anonymous access denial and staff RLS tests. Run `supabase/tests/*.sql` as rollback fixtures. Record elapsed restore time, snapshot age, failures and sign-off. Do not point the production site to the test project. Keep restored customer data access restricted and remove it after validation according to the agreed retention policy.

## Official references

- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/reference/cli/supabase-db-dump

Pending owner setup: trusted backup execution environment, protected database credentials, encrypted off-site destination, retention choice and isolated restore project. No paid subscription or PITR add-on was enabled.

## Developer portal addendum

The temporary developer account uses `/dev/`, its own password/MFA, and role `developer`. Owner/admin/editor use `/admin/`. The dedicated account grants are checked in the database, not inferred from the URL. Record `developer_grants` and `staff_activity` in database backup inventories. A revoked developer cannot restore their own grant. Current MFA-verified owners and active developers can manage grants for other existing developer accounts through the shared panel. Developers cannot change their own grant. Employee controls cannot alter owner/developer identities or grant those privileged roles. This scope was explicitly approved and deployed on 23 October 2026.

## Acceptance and backup tooling — 17 October 2026

The user confirmed draft properties, save, photo upload, customer tickets, account activity and logout/fresh MFA login all work. Backend preparation now includes local backup tools in `backup/README.md`: CLI database exports, private media download, per-file checksums and GPG encryption. Ten synthetic-fixture tests pass. The tools are not an actual backup. Database/Storage export, off-site copy and isolated restore remain pending execution on an owner-controlled trusted machine with its credentials. No production restore, new backup endpoint, paid project, retention schedule or permission bypass was introduced.


## Employee acceptance and backup coverage — 25 October 2026

After being given the activation/MFA, Editor/Admin permission, and revocation checklist, the user confirmed it was completed. Employee onboarding acceptance is user-reported; it does not establish that a database or media backup exists.

The backup coverage gate now requires all 15 current application tables, including `aup_private.staff_account_requests`, in schema and data statements. Comment-only table names do not satisfy coverage. Twelve local tests pass with synthetic fixtures (five coordinator and seven media tests). The backup runner still requires hidden local credential entry, encryption and checksum verification; no production backup/export or restore was performed by this update.

Next execution needs a trusted computer with the backup prerequisites, locally entered database password and server secret, an encrypted off-site destination, and a separate restore environment. Keep output files outside the repository and do not send credentials or plaintext dumps in chat.
