# K2 Weighbridge Slip App

A lightweight web app to generate and print weighbridge slips. Operators enter weighment details, the app calculates net/final weight (with optional dust and moisture deductions), and prints slips — 3 per A4 page.

## Tech Stack

- **Next.js** (App Router) + **TypeScript** (strict mode)
- **MongoDB** (via Mongoose) — serverless-safe connection
- **NextAuth.js v5** — session-based auth, no public signup
- **Tailwind CSS** — styling
- **Vercel** — hosting target

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AUTH_SECRET` | Random string (32+ chars) for signing sessions. Generate with `openssl rand -base64 32` |

### 3. Seed the first admin account

```bash
# Default: creates admin/admin123
npm run seed

# Custom credentials:
npx tsx scripts/seed-admin.ts myusername mypassword
```

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 and log in with the admin credentials.

## Roles

| Role | Can do |
|---|---|
| **Admin** | Manage users, companies, materials, vehicle types + everything an operator can do |
| **Operator** | Create weighment entries, search/reprint past entries |

## Project Structure

```
src/
  app/
    admin/          Admin area (users, companies, materials, vehicle types)
    entries/        Entry form + past entries list + edit
    print/          Print layout (3-up A4)
    login/          Login page
    api/            API routes (health, companies, materials, vehicle-types, entries)
  lib/
    auth.ts         NextAuth config
    calc.ts         Shared weight calculation module (the single source of truth for math)
    db.ts           Serverless-safe MongoDB connection
  models/           Mongoose schemas (User, Company, Material, VehicleType, Entry, Counter)
scripts/
  seed-admin.ts     One-time admin account creation
```

## Weight Calculation

All math lives in `src/lib/calc.ts` — one shared module used by the form, server actions, and future imports.

```
Net Weight    = Gross Weight - Tare Weight
Dust Weight   = Net Weight x (Dust % / 100)
Moisture Wt   = Net Weight x (Moisture % / 100)
Final Weight  = Net Weight - Dust Weight - Moisture Weight
```

Dust and moisture are two-way fields: enter either % or weight, and the other auto-fills. Both are optional — if empty, Final = Net.

## Deploying to Vercel

### 1. Set up MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user with read/write access
3. Under Network Access, add `0.0.0.0/0` (allow from anywhere) so Vercel's serverless functions can connect
4. Get the connection string from Connect > Drivers

### 2. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at https://vercel.com/new
3. Add environment variables in the Vercel dashboard:
   - `MONGODB_URI` — your Atlas connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
4. Deploy

### 3. Seed the admin account

After deploying, seed the first admin from your local machine (pointing at the production MongoDB):

```bash
MONGODB_URI="your-production-atlas-uri" npx tsx scripts/seed-admin.ts admin yourpassword
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (calc module) |
| `npm run seed` | Create first admin account |
