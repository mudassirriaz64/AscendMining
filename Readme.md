# AscendHash — Cloud Mining Investment Platform

**AscendHash** (formerly referenced during development as AscendXMining) is a full-stack cloud-mining investment platform where investors purchase mining packages, run 24-hour mining cycles, deposit and withdraw funds, earn through a referral program, and get live support — all backed by an admin panel for full operational control.

> ⚠️ **Status:** Active development. Some features described below are complete, others are mid-build — see the `Documentation` section for the living specs this project is built against.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose ODM) — **requires a replica set** for multi-document wallet transactions |
| Real-time | Socket.io (live chat, admin alarm system) |
| File Storage | Cloudinary |
| Auth | JWT (access + refresh tokens) — stored client-side in `sessionStorage`, **no cookies** |
| Process Management | PM2 (production) |

---

## Core Features

- **Authentication** — registration, login, password reset, referral-linked signup. No cookie-based sessions anywhere — see [Security Notes](#security-notes).
- **Investment Packages** — admin-managed packages; investors purchase from wallet balance, terms snapshotted at purchase time.
- **Mining** — investor-initiated 24-hour mining cycles ("Start Mining"), server-authoritative timers, auto-credited payouts.
- **Deposits & Withdrawals** — manual deposit approval workflow with proof-of-payment upload, withdrawal requests with admin approval and a rolling daily limit.
- **Wallet Ledger** — every balance change is a `WalletTransaction` record; the cached wallet balance is only ever updated inside the same MongoDB transaction as its ledger entry.
- **Referral Program** — unique referral links, rewards triggered on a referred user's first approved package, fraud checks against self-referral and circular chains.
- **Support Chat** — real-time chat (Socket.io) for both registered investors and anonymous guests (post pre-chat form), session tracking, a 30-minute SLA with an admin alarm that persists until a conversation is opened or replied to, formal ticket escalation, per-viewer soft-delete (hide, never erase).
- **Admin Panel** — full RBAC (Admin / Support Agent), one-stop user management view, approval queues, audit logging, CMS management.
- **Public Marketing Site** — Home, About, Services, Investment Packages (live preview), FAQs, Contact, and a guest-accessible Support page.

---

## Project Structure

```
client/                       # React app
server/
  controllers/                 # Thin request handlers
  services/                    # Business logic — the only layer enforcing business rules
  repositories/                # Mongoose query layer — only layer touching models directly
  middlewares/                 # auth, role guard, validation, rate limiting, uploads, error handling
  validators/                  # Request validation schemas
  routes/                      # Express routers
  models/                      # Mongoose schemas (matches SCHEMA.md)
  sockets/                     # Socket.io event handlers (real-time chat, admin alerts)
  jobs/                        # Background jobs — mining payout cron, wallet reconciliation, SLA checks
  utils/
  config/
  uploads/                     # Local temp storage before Cloudinary push (not committed)
```

---

## Documentation

This project is built against a set of living specification documents — **read these before making changes**, since they're the actual source of truth for business rules, schema, and architecture, not just this README:

| Document | Covers |
|---|---|
| `PRD.md` | Product requirements, user stories, acceptance criteria |
| `RULES.md` | Business rules for every module — mining, deposits, withdrawals, referrals, wallet, support chat, security |
| `SCHEMA.md` | MongoDB collection schemas and indexing strategy |
| `ARCHITECTURE.md` | Backend layering, auth model, real-time layer, file upload/Cloudinary conventions, deployment |
| `DESIGN.md` | Design system — colors, typography, component specs, validation rules |

If a change conflicts with what's in `RULES.md`, `RULES.md` wins — flag the conflict rather than silently resolving it either way.

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- A MongoDB Atlas cluster **configured as a replica set** (default on Atlas, including the free tier) — required for multi-document wallet transactions
- A Cloudinary account (for deposit proof and chat attachment uploads)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd ascendhash

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `.env` files in both `server/` and `client/` based on `.env.example` in each directory. At minimum, the server needs:

```
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
PORT=5000
```

### Running Locally

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

---

## Security Notes

- **No cookies are used for authentication anywhere.** Access and refresh tokens live in `sessionStorage` only (per-tab isolation), sent via `Authorization` header (access token) and request body (refresh token). This is a deliberate, permanent architectural decision — see `ARCHITECTURE.md` §3 and `RULES.md` §10 before reintroducing any cookie-based auth.
- Passwords are hashed (bcrypt/argon2), never logged or returned in any API response.
- Financial records (`WalletTransaction`, `AdminLog`) are append-only — no update or delete path exists for these collections at the application layer.
- Role-based access control is enforced server-side (`role.middleware.js`), not just hidden in the UI.

---

## Contributing

This is currently a solo/small-team project under active development. If you're picking up work here:

1. Read the relevant section(s) of `PRD.md` / `RULES.md` / `SCHEMA.md` / `ARCHITECTURE.md` / `DESIGN.md` before implementing a feature.
2. Follow the existing layering discipline (routes → middlewares → controllers → services → repositories → models) — services are the only layer that should contain business logic.
3. Flag any conflict between what you find in the code and what the docs say, rather than assuming either is automatically correct.

---

## License

Proprietary — all rights reserved. (Update this section if you intend to open-source any part of the project.)