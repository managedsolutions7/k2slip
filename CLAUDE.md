# CLAUDE.md — Weighbridge Slip App

This file is the source of truth for the project. Read it before making changes. If something here conflicts with a request, ask before deviating.

---

## What this app is

A lightweight web app to generate and print weighbridge slips from manual data entry. It is a separate, simpler app — **not** a replacement for the existing K2 weighbridge CRM. The main job is: an operator types in weighment details, the app calculates net/final weight, and prints slips (3 per A4 page to save paper).

Records are also kept so they can be searched and reprinted later.

---

## Tech stack

- **Framework:** Next.js (App Router, latest stable)
- **Language:** TypeScript
- **Database:** MongoDB Atlas (via the official `mongodb` driver or Mongoose — pick one and stay consistent; prefer Mongoose for schema + validation)
- **Auth:** username + password, session-based. **No public signup.** Admin creates all accounts.
- **Hosting:** Vercel (serverless). Keep MongoDB connection serverless-safe (cache the client across invocations — do not open a new connection per request).
- **Styling:** Tailwind CSS.
- **Print:** browser-native (`window.print()`) with a dedicated print-only CSS layout. No printer drivers, no native integration.

### Environment variables
- `MONGODB_URI`
- `AUTH_SECRET` (session signing)
- Any others as needed — document them in `.env.example`, never commit real values.

---

## Roles

Two roles only. Keep it simple.

- **Admin**
  - Creates and manages operator/admin accounts
  - Manages **Companies** (the slip header)
  - Manages master lists: **Materials** and **Vehicle Types**
  - Can do everything an operator can
- **Operator**
  - Creates weighment entries
  - Searches/reprints past entries
  - Cannot manage users, companies, or master data

There is 1–3 operators total. One operator can create entries for any company.

---

## Core domain: the weighment slip

A truck is weighed loaded (gross), then empty (tare). If the material carries dust/moisture, those are deducted too.

### The math (this is critical — get it exactly right)

```
Net Weight    = Gross Weight − Tare Weight
Dust Weight   = Net Weight × (Dust % / 100)
Moisture Weight = Net Weight × (Moisture % / 100)
Final Weight  = Net Weight − Dust Weight − Moisture Weight
```

- All weights are in **kg**.
- Dust and moisture are **two-way fields**: the operator can type either the **percentage** OR the **weight directly**, and the other is auto-filled.
  - Enter dust % → `Dust Weight = round(Net × dust% / 100)`
  - Enter dust weight → `Dust % = (Dust Weight / Net) × 100`
  - Same logic for moisture.
- Net must be known before % ↔ weight conversion can resolve. If Gross or Tare is missing, hold the conversion and show net as blank/0.
- Dust and moisture are **optional**. If both are empty, `Final Weight = Net Weight`.
- **Rounding:** weights stored as numbers. Display/round to a sensible kg precision — confirm with the user whether they want whole kg or decimals before finalizing. Default to 2 decimals internally, display whole kg unless told otherwise.

### Fields on an entry

| Field | Source | Notes |
|---|---|---|
| Company | dropdown (from Companies) | drives the printed header |
| Printed Slip No | **typed manually** | the company's own slip-book number; printed on slip |
| Internal ID | auto | unique, **not printed**, used for app-side tracking/search |
| Date | manual (default today) | |
| Driver Name | manual | |
| Driver Contact No | manual | |
| Vehicle Type | dropdown + free text | from master list, but can type a new value |
| Type of Material | dropdown + free text | from master list, but can type a new value |
| Gross Weight (kg) | manual | |
| Tare Weight (kg) | manual | |
| Net Weight (kg) | calculated | Gross − Tare |
| Dust % / Dust Weight | manual, two-way | optional |
| Moisture % / Moisture Weight | manual, two-way | optional |
| Final Weight (kg) | calculated | Net − dust wt − moisture wt |
| Signature | line on printed slip | not a data field |
| Operator | auto | who created the entry |
| Created / Updated timestamps | auto | |

**Do NOT** store a per-vehicle saved tare weight. Tare is always entered fresh per weighment.

---

## Companies (slip header)

Admin-editable list. Each company has:
- **Name** (e.g. "K2 Biofuels Pvt. Ltd.")
- **Address** (single line or block, e.g. "Khursed Nagar, Rewari, Haryana - 123303")
- **Phone** (single number, most likely)

Reference names (the user will set these up later, not hardcoded): K2 Power, K2 Biofuels, K2 Ethanol.

The printed slip header mirrors the uploaded sample: large bold company name, address line, phone line.

---

## Printing — the important UX

- Slip size = **1/3 of A4**. Three slips fit on one A4 sheet.
- Printing is **batch**: operator selects N entries (could be 1, could be 12), and they are laid out **3 slips per A4 page**, paginating onto multiple pages as needed. These are *different* entries stacked to save paper — NOT three copies of the same entry.
- Use a print-only layout (`@media print`) with exact A4 sizing and clean page breaks between groups of 3. Screen UI must not appear in print, and the slip must not appear cluttered.
- Each printed slip shows the company header + all slip fields, matching the layout of the uploaded sample (Slip No, Date, Driver Name/Contact/Vehicle Type, Type of Material, Gross/Tare/Net/Final weights, Dust %, Moisture %, Signature line, and the footer line "Goods once weighed will not be taken back. Thank You!").
- The internal ID is **never** printed.

---

## Past entries

- Searchable / filterable list: by **company**, **date (range)**, **vehicle**, and ideally driver/slip no.
- Reprint any past entry (sends it into the same 3-up print layout).
- Pagination for large datasets.

---

## Bulk import (later phase, not now)

The user has existing records and will bulk-import them. **Do not build this until the user provides a sample of their data (Excel/CSV with real columns).** When building, map their columns to the entry schema and validate before inserting. Forward entry works without it.

---

## Conventions

- TypeScript strict mode on.
- Server components / server actions where they fit; client components only where interactivity needs them (entry form live calc, print selection).
- Validate all input on the server, not just the client.
- Keep business math (`net`, `final`, two-way dust/moisture) in **one shared, tested module** so the form, the API, and any import all use the same logic. Do not duplicate the formula.
- Money/weight numbers: never use floating-point surprises — round at well-defined points.
- Clear, direct code and comments. No over-engineering.

---

## Out of scope (do not build unless asked)

- No serial/RS232 reading from the weighbridge indicator — all weights are typed.
- No stored per-vehicle tare.
- No public signup / self-registration.
- No multi-tenant isolation — it's one org, multiple company headers, shared data.
- No thermal/driver-specific printer integration — browser print only.
