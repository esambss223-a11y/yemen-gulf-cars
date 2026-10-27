# Developer maintenance center

The existing `super_admin` role continues to manage staff and other administrators.
Maintenance access additionally requires `auth.users.raw_app_meta_data.maintenance_access = true`.
The username and user-editable metadata never authorize maintenance. The server loads the
current user and active staff profile on every request. Ordinary administrators do not receive
this flag when creating more administrators.

## One-time installation

1. Run `supabase/migrations/20261026_maintenance.sql` in this project's Supabase SQL editor.
   The migration only installs a maintenance event table and three functions. It does not
   reset, repair, restore, or delete operational records.
2. The `developer` account has already been provisioned. Its local credentials are in
   `.private/developer-credentials.json`. Do not commit this directory or place it in `public`.
3. `scripts/enable-developer-center.mjs --enable-for olpjfipferziqtzrbbbt` grants the flag only
   to that existing account. It does not change the password or staff role.
4. Reload `/admin`. The developer's overview becomes the maintenance center; other users
   retain their current overview. Check that the maintenance engine is reported as ready.
5. These application changes must be deployed before the new center is available on the
   public Vercel deployment. Installing the migration alone does not deploy application code.

For installations created before the safeupdate correction, run
`supabase/migrations/20261026_maintenance_safeupdate.sql`. It replaces only the mutation
function and does not execute reset/restore. Intentional reset deletes use the explicit
`WHERE id IS NOT NULL` predicate on the nine approved primary-key tables. Supabase's
safeupdate protection remains enabled.

## Backup scope and limits

An operational backup contains nine tables: owners, cars, customers, coupons, bookings,
invoices, site_visits, permission_requests, and audit_logs. Inline images in these rows are
included. Separate Storage objects, Supabase Auth/password hashes, staff, SQL schema, policies,
application code, and hosting secrets are not included. Use Supabase's database backups/CLI
and a separate copy of Storage objects for complete disaster recovery.

Backups are signed server-side. `MAINTENANCE_BACKUP_SECRET` is the recommended stable signing
secret; until configured, the service-role/secret key is used. Changing the signing secret
invalidates old signatures. Do not rotate it without preserving the old key and arranging
backup migration. Never store the secret in browser-exposed environment variables.

This interface accepts requests up to 3 MB, below the deployment's body-size ceiling.
Large databases require a separate backup worker/database tooling. Backups are downloaded
manually; no automatic/off-site backup service has been installed by this change.

## Mutating operations

Reset, restore, and targeted repair first generate a current snapshot and a five-minute,
actor-bound signed ticket. The operator downloads that backup, confirms saving it, enters
the operation phrase and their password. A fresh Supabase password verification is required.
The database locks the selected business tables, checks both business and staff fingerprints,
and applies the entire operation in one transaction. Changed data requires a new backup.
The ticket UUID is recorded once, preventing replay even against empty tables.

Staff and Auth accounts are never reset/restored. Staff records are checked before and
after execution. Maintenance events survive business resets. No dynamic SQL or caller-supplied
table names are executed. RPC functions cannot be executed by anon or authenticated roles.

Repair is deliberately specific: mark an `available` car as `rented` if it has an active
booking. Maintenance/cleaning states are not changed. Code bugs, infrastructure failures,
and arbitrary database corruption are not automatically repaired by this tool.

Run resets at a quiet time. Incoming visits/bookings can invalidate the backup fingerprint;
this intentionally stops the operation rather than discarding records not in the saved snapshot.

## Validation

`node --test scripts/lib/maintenance-security.test.mjs scripts/lib/provision-staff.test.mjs scripts/lib/staff-admin-access.test.mjs`

For real SQL transaction tests against an in-memory PostgreSQL engine, install the optional
test runtime in the ignored private directory, then run:

```
npm install --prefix .private/maintenance-test-runtime --no-save --no-audit --no-fund --ignore-scripts @electric-sql/pglite
node scripts/test-maintenance-db.mjs
```

The database test never connects to Supabase. It covers rollback on failed restore, exact
restore, reset with preserved account/password hashes, role denial, changed-data protection,
ticket replay protection, and narrowly scoped repair.
