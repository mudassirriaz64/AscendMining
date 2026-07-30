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

## Project Structure & Folder Details

The repository follows a clean, decoupled architectural design separating client concerns (React SPA) from backend logic (Node/Express REST API & Sockets). Below is the comprehensive walk-through of the codebase folder-by-folder:

---

### 📂 Client Layer (`/client`)
The frontend is a React application built with **Vite** and **Tailwind CSS**. It is organized into clean, modular folders inside the `src/` directory:

*   **`src/assets/`** — Static asset repository. Holds theme images, default placeholders, branding graphics, and custom icons.
*   **`src/components/common/`** — Reusable, atomic UI components.
    *   `Button.jsx` / `InputField.jsx` / `SelectField.jsx` — Standardized form inputs designed to reflect the gold-yellow on dark-blue theme system.
    *   `DataTable.jsx` / `Pagination.jsx` — Power user directories, lists, and transaction history grids.
    *   `Header.jsx` / `PublicHeader.jsx` / `PublicFooter.jsx` — Global navigation layouts for authenticated dashboards and marketing views.
    *   `Modal.jsx` / `ConfirmModal.jsx` / `PromptModal.jsx` — Overlay dialogues for approvals, confirmations, and parameter inputs.
    *   `SupportChatWidget.jsx` — Sticky bottom-right live chat interface accessible to logged-in users and guests. Supports image/document/video attachments and displays upload boundaries dynamically.
*   **`src/hooks/`** — Shared React hooks. Holds viewport dimensions watchers, interval polls, and socket subscription handlers.
*   **`src/layouts/`** — High-level layout wrappers.
    *   `AdminLayout.jsx` — The side-navigation structure of the admin dashboard, housing the global user search bar, sidebar toggles, and metric highlights.
    *   `PublicLayout.jsx` — Theme wrapper for all landing pages.
*   **`src/pages/`** — Page views mapped directly to client-side routing:
    *   `pages/public/` — Landing Page, About, Services, FAQs, and Contact pages.
    *   `pages/auth/` — Login, Signup (referral-linked), and Password Reset modules.
    *   `pages/dashboard/` — Main investor account overview displaying metrics, charts, and activity feeds.
    *   `pages/mining/` — Packages listing and mining console pages where users trigger active cycles.
    *   `pages/account/` — User Profile, Wallet Addresses, and KYC Verification page (supports 20MB document proof uploads).
    *   `pages/withdrawal/` — Withdrawals list and "Withdraw Now" request pages.
    *   `pages/support/` — Large chat console (`SupportChatPage.jsx`) displaying full conversations.
    *   `pages/admin/` — Admin management dashboards (RBAC restricted):
        *   `admin/dashboard/` — Redesigned live metrics board with dynamic SVG trend charts.
        *   `admin/users/` — Detailed registry page with server-side filters.
        *   `admin/deposits/` / `admin/withdrawals/` — Admin queues for manual confirmation.
        *   `admin/kyc/` — Review panel for user document proofs.
        *   `admin/support/` — Agent ticketing dashboard mapping alerts, online tags, and SLAs.
*   **`src/services/`** — Network communication configurations.
    *   `api.js` — Axios client configured with interceptors to automatically retrieve tokens and refresh credentials dynamically.
    *   `socketService.js` — Socket.io setup connecting the live support chat.
*   **`src/store/`** — Redux Toolkit central state manager.
    *   `store.js` — State container config.
    *   `store/slices/` — Individual slices (e.g., `authSlice`, `dashboardSlice`, `supportChatSlice`, `adminUserSlice`) keeping API bindings separated.
*   **`src/styles/`** — Global CSS files.
*   **`src/utils/`** — Front-end utility handlers.
    *   `date.js` — Formatters for dates, relative times, and clock displays.
    *   `browser.js` — Helper methods like favicon flashes or title alerts.
    *   `videoCompressor.js` — Client-side compressor that downsamples large video attachments to WebM containers.

---

### 📂 Server Layer (`/server`)
The backend is a Node.js API built using Express. It is structured into strict architectural layers to segregate data access, business logic, routing, validation, and real-time socket events:

*   **`config/`** — Initial boot files.
    *   `db.js` — Database connectors matching the MongoDB Atlas connection schema.
*   **`models/`** — Mongoose models representing database schemas (see `SCHEMA.md`):
    *   `User.js` — User model containing wallet values, KYC indicators, and reference hashes.
    *   `Conversation.js` / `ConversationMessage.js` / `ConversationSession.js` — Support chat structures.
    *   `WalletTransaction.js` — Ledger for financial audit trails.
    *   `Deposit.js` / `Withdrawal.js` / `SupportTicket.js` / `UserPackage.js` — Core functional records.
*   **`repositories/`** — Mongoose query layer. The **only** layer authorized to interact with MongoDB collections directly, keeping controllers/services database-agnostic.
*   **`services/`** — The business logic engine. This layer holds the authoritative rules (such as KYC checks, package activation limits, and referral chain calculations).
*   **`controllers/`** — Thin controllers parsing parameters and returning standard REST responses. Divided into user domains and admin directories (`controllers/admin/`).
*   **`middlewares/`** — Request filters.
    *   `auth.middleware.js` — JWT parser extracting user ids.
    *   `role.middleware.js` — Route filters restricting access based on user role.
    *   `upload.middleware.js` — File parser supporting 200MB payloads and video formats.
*   **`validators/`** — Zod/Express request input schemas ensuring only validated data flows into services.
*   **`routes/`** — Express routers mounting endpoints and mapping controller paths.
*   **`sockets/`** — Sockets namespace directories.
    *   `supportChat/` — Support sockets capturing typing events, message deliveries, and admin alarm alerts.
    *   `dashboard/` — Sockets serving stats updates.
*   **`jobs/`** — Background cron jobs.
    *   `supportSlaCheck.cron.js` — Automated checks monitoring active conversations.
*   **`utils/`** — Shared helpers (e.g., seeding setups, conversation deduplicators, email templates).

---

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