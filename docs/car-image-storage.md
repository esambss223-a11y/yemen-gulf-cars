# Car photo storage

Files selected from a device are stored in the public Supabase `car-images` bucket. The existing `cars.images` and `cover_image` fields keep URL references; no schema migration is required. Existing photo references are unchanged. Suggested catalog images and manually entered external URLs remain external references.

## Setup

Run `node scripts/setup-car-image-storage.mjs` from the project directory with `.env.local` configured. This creates an empty public bucket only when missing, restricted to JPEG/PNG/WEBP and 4 MiB per object. It does not change the subscription or expose an existing private bucket. No anonymous upload policies are required: the authenticated server endpoint performs writes with its service client.

The deployment must have `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) configured on the server, alongside the existing public Supabase configuration. Never prefix the service key with `NEXT_PUBLIC_`. Redeploy Vercel after configuring the environment or publishing these code changes. Vercel's application filesystem is not used for uploaded files.

## Upload flow

- The browser validates and decodes the selected JPEG/PNG/WEBP (source limit 20 MiB), reduces images to at most 1920 pixels per side when needed, and encodes larger images as WebP. Small images retain their original encoding.
- `POST /api/admin/cars/images` verifies the bearer session and active `super_admin` membership. It bounds multipart requests, checks the actual file signature, and uploads a new UUID path under `cars/<verified-staff-id>/` without overwriting another file. The API file cap is 4 MiB, below Vercel's function request limit including multipart overhead.
- Only successful uploads add a public URL to the form. The user must save the car to persist this reference. Failed uploads never fall back to a data URL inside PostgreSQL. Saving/closing the form is disabled during the upload; leaving the editor cancels its pending client request.
- Removing a reference or abandoning an editor does not delete the underlying stored file. Automatic storage deletion is deliberately absent because URLs may be referenced elsewhere; unreferenced objects need a separate reviewed cleanup process.

This bucket is for public vehicle marketing photos only. Signed contracts and identity documents require a separate private bucket and authorized download flow. Existing maintenance JSON backups contain the image URLs, **not** the image files: file backup must be handled separately before any storage deletion/reset.

Validation: `node --test scripts/lib/car-images.test.mjs` checks authorization, successful URLs, storage failures, supported file signatures and request/file size limits. A live upload check may upload a temporary verification file, read it back, then remove only that exact verification object; it must never update a real car row.
