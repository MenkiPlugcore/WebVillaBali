# Agung Ubud Property — stage 1 security audit

Date: 11 October 2026. Scope: current WebVillaBali repository, deployed Supabase functions, database policies/grants, private media storage, and public HTTP denial checks. This is an initial application audit, not a penetration-test certificate or assurance that every vulnerability has been found.

## Findings and fixes

| Finding | Priority | Result |
| --- | --- | --- |
| Database staff permissions relied on JWT metadata, allowing stale staff claims after role removal until token expiry | High | Fixed: caller role comes from current Auth user and matching active session. Deleted/banned users, expired/missing sessions, and nonstaff roles are denied. |
| Ticket table grants allowed more actions than the panel needed | Medium | Fixed: authenticated staff can update status/internal_notes only. Customer fields, direct insert and delete are denied; server intake retains its privileges. |
| Media parsing trusted Content-Length for overall request size | Medium | Fixed: actual streamed body size is bounded before multipart/JSON parsing. |
| Privileged media signing/removal lacked strict path and parent checks | Medium | Fixed: only generated JPG/PNG/WebP paths belonging to the requested table and parent are accepted. |
| Logout only cleared the local session | Medium | Fixed: explicit logout requests server session revocation (global scope); failures are reported. The database checks session existence on staff operations. |
| Public pages lacked a script CSP | Defense in depth | Fixed: self-hosted scripts only, restricted resource hosts, no framing/objects, HTTPS policy. Compare preferences moved out of inline script to preserve behavior. |
| Dashboard source was included in static assets | Low | Excluded with other admin source. Browser bundle is intentionally public; authorization remains server-side. |

The new private SECURITY DEFINER helper is deliberately narrow: no arguments, empty search_path, caller UID/session only, a role string only, no writes or arbitrary Auth access. It is outside the public API schema and defaults are revoked. Public staff_access() is SECURITY INVOKER, returns only a caller-scoped boolean, and is unavailable to anon.

## Verification

- Automated suite: 64 tests covering UI, content escaping, role checks, media requests, revoked-session rejection, logout failures, body limits, parent/path checks, and CSP/deployment compatibility.
- Five rollback SQL suites: public/draft visibility; owner/admin/editor/customer boundaries; guest consent; ticket reference handling, idempotency and quotas; current role/session revocation. All fixtures rolled back. Ticket status handling was rechecked after column-grant restriction.
- Public HTTP: private inquiries denied (401), direct intake RPC hidden/denied (404), staff RPC denied to anonymous callers (401), media without login or with invalid token denied (401), malformed catalog pagination rejected (400), catalog available (200).
- Static HTTP: config, function source, backend docs, environment file, lockfile and admin tests/source return 404.
- All ten public tables have RLS; media bucket is private. No default public view bypass exists. Intake RPC is server-only; public catalog reads database anonymously before signing an eligible image for five minutes.
- Current tracked-text secret scan found no service-role JWT, sb_secret key, private key block or hardcoded Tripay credential. This does not certify repository history, VPS files, or third-party logs.
- npm audit reported zero known advisories in installed production and development dependencies at audit time. This is not a guarantee against undisclosed flaws.

## Open actions before final handover

1. Disable public account signup in Supabase Auth. Public settings currently report disable_signup=false. Signup does not grant staff access; staff role comes from trusted app_metadata plus live Auth/session checks. The connected plugin has no Auth-settings mutation operation, so this setting requires the project dashboard.
2. Leaked-password protection is disabled. Supabase documents this feature as Pro-plan-and-above; no paid plan change was made. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
3. Add and test admin MFA enrollment/recovery and backend enforcement before handover; do not mandate an unconfigured factor and lock the owner out. Evaluate login CAPTCHA, password strength and Auth rate settings.
4. Audit VPS/Tripay separately with explicit server access. No SSH firewall, OS updates, PM2 credentials, Tripay callback validation, backups or restoration were inspected in this audit. Future WA service must use separate credentials and service permissions.
5. Perform the roadmap's final audit again after WA integration. Backup/restore testing, monitoring, session-lifetime policy and incident response remain in that phase.

## Limitations

No load/DoS test, credential guessing, real customer ticket creation, persistent test user, or payment action was performed. Tests do not impersonate the owner in the browser or mint login tokens. Full authenticated browser testing requires a legitimate staff login; role/session assertions here used trusted SQL rollback fixtures and mocked panel tests. Image checks cover permitted signatures/MIME/path/size, not full decoding or malware scanning. Contact/global intake quotas mitigate abuse but Origin checks and honeypots alone are not bot authentication.
