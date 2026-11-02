---
name: strix-security
description: "AI penetration testing, automated security auditing, and vulnerability scanning with Strix. Audits Next.js API routes, Supabase Row-Level Security (RLS), admin authentication, and customer data privacy."
---

# Strix Security & Penetration Testing Skill

This skill guides automated security auditing, penetration testing, and vulnerability prevention using **Strix** principles and security runbooks.

## When to Use

- Auditing public vs private data boundaries (e.g. ensuring car plate numbers `plateNumber` are never exposed in public API responses or client-side bundles).
- Verifying Supabase Row-Level Security (RLS) policies on `cars`, `bookings`, and `staff` tables.
- Hardening the admin dashboard (`/admin`) authentication against unauthorized access.
- Validating input sanitization on booking forms and reservation modals to prevent injection attacks.

## Strix Architecture & Core Concepts

1. **Autonomous Reconnaissance**: Probing application endpoints and mapping exposed data contracts.
2. **Dynamic Exploitation Verification**: Generating concrete Proof-of-Concepts (PoCs) rather than generic static warnings.
3. **Actionable Remediation**: Providing exact code diffs and schema patches to fix identified vulnerabilities.

## Critical Security Checklist for Yemen Gulf Cars

### 1. Privacy Protection (Strict Policy)
- **Car Plate Numbers**: The `plateNumber` field must remain isolated to staff admin sessions. Never expose it in `PUBLIC_CAR_FIELDS` queries.
- **Customer Phone & Identity**: Customer identities and booking requests must only be readable by authorized staff members.

### 2. Next.js 16 Security
- Keep Next.js updated to the latest patched releases (`v16.4.3+`) per security advisories.
- Enforce strict server-side validation using Zod or equivalent schemas on all incoming API requests.

### 3. Supabase RLS Enforcement
- Public client keys (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) should only have SELECT access to `status = 'available'` cars and INSERT access for new bookings.
- Administrative operations (car creation, deletion, booking approvals) must require authenticated session tokens or secure service role handlers.
