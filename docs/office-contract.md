# Office paper contracts

The contract is completed on screen, printed A4 and signed with a pen in the office. A signed scan/photo is optional and never gates booking creation, approval, handover or return. The existing four terms and the agreed late rule (EGP 200/hour with advance notice and approval, otherwise one daily rental) are retained.

New office contracts use one creation dialog: customer/license, vehicle/handover, then review/save. Supplementary contract fields are entered in this flow. `POST /api/admin/contracts/create` stores the booking and its document in a **single insert**, with verified staff attribution. It never requires a second document-save action. The client retains the same pending booking identity for unchanged retries; the endpoint returns the existing matching document after a lost response, and the hook prevents concurrent submits from repeating dependent invoice/customer/car operations. Existing dependent financial calculations are unchanged.

After success the saved contract file opens automatically for review and printing. This file contains the read-only booking/document facts, optional signed attachments and a collapsed edit section for corrections/legacy contracts. There is no separate preparation tab.

## Installation

1. Run `supabase/migrations/20261028_rental_contract.sql` once in the project SQL Editor. It adds only nullable `bookings.contract_record`; existing bookings, finance fields and accounts are unchanged. Old maintenance backups restore this absent field as NULL; new JSON backups include the document details and attachment references.
2. Run `node scripts/setup-contract-storage.mjs` with the project's server environment. The dedicated `rental-contracts` bucket must be **private**, with PDF/JPEG/PNG/WEBP and a 4 MiB object cap. Never make this bucket public or reuse `car-images`. No public read/upload policies are needed.
3. Deploy the code with the existing server-only Supabase service key. The local app can use the same project once SQL is installed.

If the column is missing, the contract screen shows an explicit setup message; existing printing remains available. New fields and uploads report failure instead of pretending to save.

## Data and authorization

The JSON document contains supplementary addresses, license/vehicle/additional-driver fields, optional paid-rent declaration, revision UUID, updated employee/time and scan metadata. Normal booking/return financial logic and invoices are untouched. The paid-rent entry is a declaration for paper printing and must match an actual payment receipt; it does not collect money or change invoices. Blank data produces writing lines rather than invented values (including fuel).

Active staff can view a contract and request a download; only managers and rental agents can save or attach files. The authenticated API validates fields, file signatures and request size, generates paths itself, and checks the document revision before and during the write. An upload losing a concurrent-save race removes only its own new unlinked file. Saving does not overwrite other booking columns. File URLs are never public or stored as permanent URLs: download requires an employee session and yields a short-lived signed attachment URL (60 seconds). Already issued links remain usable until expiration, and downloaded copies remain on the recipient's device.

Files preserve their original bytes; signed scans/PDFs are not recompressed or modified. A document can have up to eight files (for pages or replacement signed copies); existing attachments are retained. After signing, any modified paper contract needs reprinting and a new handwritten signature. The system stores copies, not an electronic signature or a claim of legal certification.

**Storage backup is separate:** the maintenance JSON snapshot includes references, not file bytes. Maintenance reset/restore does not remove stored files. Reintroducing old JSON backups cannot restore removed Storage objects. Retain originals and export the private bucket separately before deleting anything in Storage.
