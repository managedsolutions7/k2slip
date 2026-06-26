# BUILD ROADMAP — Weighbridge App

A sequence of prompts for Claude Code. Run them **one phase at a time**, in order. Test each phase before moving on. `CLAUDE.md` in the repo root is the spec — every prompt assumes Claude Code has read it.

> Tip: start each Claude Code session by making sure `CLAUDE.md` is loaded, then paste the phase prompt. Don't paste multiple phases at once — let each one land and verify it.

---

## Phase 0 — Scaffold & infrastructure

```
Read CLAUDE.md. Scaffold a new Next.js (App Router, TypeScript, Tailwind) project for the weighbridge slip app.

Set up:
- The Next.js app with TypeScript strict mode and Tailwind configured.
- MongoDB connection using Mongoose, written serverless-safe for Vercel (cache the connection across invocations using a global; do NOT connect per request).
- A .env.example documenting MONGODB_URI and AUTH_SECRET. Do not commit real secrets.
- A clean folder structure: lib/ for db + shared logic, models/ for schemas, app/ for routes.
- A basic health-check route that confirms the DB connects.

Do not build auth, models, or pages yet beyond what's needed to prove the DB connects. Show me the structure when done.
```

---

## Phase 1 — Data models & shared math

```
Read CLAUDE.md. Create the Mongoose models and the shared calculation module.

Models:
- User: username (unique), passwordHash, role ('admin' | 'operator'), timestamps.
- Company: name, address, phone, timestamps.
- Material: name, unique. (master list)
- VehicleType: name, unique. (master list)
- Entry: company ref, printedSlipNo (string, manual), internalId (unique, auto, never printed), date, driverName, driverContact, vehicleType (string), material (string), grossWeight, tareWeight, netWeight, dustPercent, dustWeight, moisturePercent, moistureWeight, finalWeight, operator ref, timestamps.

Then create lib/calc.ts — ONE shared module with pure, unit-tested functions implementing exactly the math in CLAUDE.md:
- computeNet(gross, tare)
- dustWeightFromPercent / dustPercentFromWeight (against net)
- same for moisture
- computeFinal(net, dustWeight, moistureWeight)
Handle the edge cases from CLAUDE.md (missing net, optional dust/moisture, rounding). Add unit tests for the math.

The form, API, and future import must all use this module — do not duplicate the formula anywhere.
```

---

## Phase 2 — Auth

```
Read CLAUDE.md. Build username/password authentication.

- Session-based login (no public signup). A login page; logout.
- Password hashing (bcrypt or argon2).
- Middleware/guards: unauthenticated users redirect to login; operator role cannot reach admin routes.
- A one-time seed script to create the first admin account (reads credentials from env or prompts), since there's no signup.

Keep it simple and standard. Show me how to create the first admin.
```

---

## Phase 3 — Admin: users, companies, master data

```
Read CLAUDE.md. Build the admin area (admin role only).

- User management: list users, create operator/admin accounts, reset password, deactivate.
- Company management: CRUD for Company (name, address, phone). This is the slip header.
- Materials: CRUD list.
- Vehicle Types: CRUD list.

Plain, functional admin UI with Tailwind. Server-side validation on everything. Operators must get 403/redirect if they hit these routes.
```

---

## Phase 4 — Operator: the entry form (the core screen)

```
Read CLAUDE.md. Build the weighment entry form — this is the most important screen.

Fields per CLAUDE.md. Behavior:
- Company: dropdown from Companies.
- Printed Slip No: typed manually.
- Date: defaults to today, editable.
- Vehicle Type and Material: dropdown from master lists BUT also allow typing a new free-text value.
- Gross, Tare: numeric. Net = Gross − Tare, shown live.
- Dust and Moisture: two-way fields. Operator types EITHER % OR weight; the other auto-fills live using lib/calc.ts. Both optional.
- Final Weight: calculated live, shown clearly.
- On save: server re-validates and recomputes using lib/calc.ts (never trust client math), stores the entry with operator = current user and an auto internalId.

After save, offer to print this slip immediately (feeds into the print layout from Phase 6).
```

---

## Phase 5 — Past entries list

```
Read CLAUDE.md. Build the past-entries view.

- Searchable/filterable list: by company, date range, vehicle, driver, and slip no.
- Paginated.
- Each row: view details, edit (recompute on save via lib/calc.ts), and select-for-print.
- Multi-select so several entries can be sent to the batch print layout together.
```

---

## Phase 6 — Print layout (3-up A4)

```
Read CLAUDE.md. Build the print layout. This must match the uploaded sample slip and the 3-per-A4 rule.

- A print route/view that takes a set of selected entry IDs.
- Each slip = 1/3 of A4, three slips per A4 page, paginating across pages for more entries. These are DIFFERENT entries stacked to save paper.
- Each slip renders: company header (large bold name, address, phone) + Slip No, Date, Driver Name/Contact/Vehicle Type, Type of Material, Gross/Tare/Net weights, Dust %, Moisture %, Final Weight (After Deduction), Signature line, and the footer "Goods once weighed will not be taken back. Thank You!"
- Use @media print CSS with exact A4 sizing and clean page breaks between groups of 3. No app chrome in print. Internal ID never printed.
- Trigger window.print() cleanly. Make sure margins/scaling produce three tidy slips per sheet.

Show me how it looks and we'll fine-tune spacing.
```

---

## Phase 7 — Polish & deploy

```
Read CLAUDE.md. Final pass before deploy.

- Error/empty/loading states across screens.
- Confirm role guards everywhere.
- Confirm DB connection is serverless-safe for Vercel.
- README with setup, env vars, seeding the first admin, and deploy steps.
- Walk me through deploying to Vercel with MongoDB Atlas (env vars, allowed IPs, etc.).
```

---

## Phase 8 — Bulk import (LATER — only when sample data is ready)

```
Read CLAUDE.md. Build bulk import of existing records.

I will provide a sample file (Excel/CSV) with the real columns. Map those columns to the Entry schema, validate every row, recompute net/final via lib/calc.ts (don't trust imported totals blindly — flag mismatches), preview before insert, and import in batches. Report rows that failed validation instead of silently dropping them.
```

---

### Suggested order recap
0 scaffold → 1 models+math → 2 auth → 3 admin → 4 entry form → 5 past entries → 6 print → 7 deploy → (8 import later)

Phases 1 and 6 are where the real risk lives (the math, and the A4 print layout). Spend extra verification there.
