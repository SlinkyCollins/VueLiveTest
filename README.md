# Vaultly — Full-Stack Digital Banking Demo

A full-stack banking demo built with Vue.js, Laravel and MySQL. The frontend is a single-page app
handling auth, wallet operations, beneficiary management, and profile flows. The backend
enforces transactional integrity on all money movement using database transactions with
row-level locking. Deployed and functional end-to-end.

![Vue](https://img.shields.io/badge/Vue-3.5-42b883)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff)
![PrimeVue](https://img.shields.io/badge/PrimeVue-4.5-06b6d4)
![Status](https://img.shields.io/badge/Deployment-Live-success)

## Table of Contents

- [Why This Project](#why-this-project)
- [Live Demo](#live-demo)
- [Features](#features)
- [Core Flows and Demo](#core-flows-and-demo)
- [Tech Stack](#tech-stack)
- [System Highlights](#system-highlights)
- [Project Structure](#project-structure)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Prerequisites](#prerequisites)
- [Scripts](#scripts)
- [Development Workflow](#development-workflow)
- [Build and Deployment Notes](#build-and-deployment-notes)
- [Known Constraints](#known-constraints)
- [FAQ and Troubleshooting](#faq-and-troubleshooting)
- [License](#license)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Why This Project

Vaultly is a full-stack banking demo built to demonstrate real-world patterns — not just CRUD.

On the frontend: the app is a single-page Vue 3 app with Pinia state management, global 401
handling, and route ownership guards so users can't access each other's dashboard by changing
a URL param. The build followed a logic-first sequence — core API flows and state management
came before UI polish — so the interface is backed by real transaction semantics throughout.

On the backend: all money movement (deposit, transfer, withdraw) runs inside database
transactions with row-level locking to prevent race conditions. Auth is handled via Laravel
Sanctum bearer tokens. Media is managed through Cloudinary with deterministic public ID
tracking so profile pictures can be replaced or deleted cleanly without orphaning assets.

## Live Demo

- Frontend: https://vaultlydemo.vercel.app
- Backend API: https://laravellivebankapptest.onrender.com/api
- Backend repository: https://github.com/SlinkyCollins/vaultly-backend

> The backend is on a free-tier host. The first request after idle may take 20–30 seconds to
> respond (cold start). Subsequent requests are fast.

## Features

- Token-based authentication with protected routes and session expiry handling
- Deposit, transfer, and withdrawal — each PIN-verified and balance-validated client-side before submission
- Transfer shortcut from saved beneficiaries — select a recipient and the account number pre-fills
- Beneficiary management: add, edit, delete saved recipients with inline validation
- Transaction history with credit/debit direction visibility
- Profile management: name, account details, and Cloudinary-backed profile picture upload and removal
- PIN setup, PIN change, and password change flows
- Route ownership enforcement — URL param manipulation redirects to the authenticated user's own dashboard

## Core Flows and Demo

### Dashboard Overview

<p align="center">
  <img src="./assets/screenshots/dashboard.png" alt="Vaultly Dashboard" width="100%" />
</p>

### Authentication

<p align="center">
  <img src="./assets/screenshots/login.png" alt="Authentication UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/auth.gif" alt="Authentication Demo" width="100%" />
  </p>
</details>

### Deposit

<p align="center">
  <img src="./assets/screenshots/deposit.png" alt="Deposit UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/deposit.gif" alt="Deposit Demo" width="100%" />
  </p>
</details>

### Transfer

<p align="center">
  <img src="./assets/screenshots/transfer.png" alt="Transfer UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/transfer.gif" alt="Transfer Demo" width="100%" />
  </p>
</details>

### Beneficiaries

<p align="center">
  <img src="./assets/screenshots/beneficiaries.png" alt="Beneficiaries UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/beneficiaries.gif" alt="Beneficiaries Demo" width="100%" />
  </p>
</details>

### Transaction History

<p align="center">
  <img src="./assets/screenshots/transactions.png" alt="Transaction History UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/transactions.gif" alt="Transaction History Demo" width="100%" />
  </p>
</details>

### Profile

<p align="center">
  <img src="./assets/screenshots/profile.png" alt="Profile UI" width="100%" />
</p>

<details>
  <summary>See it in action</summary>
  <p align="center">
    <img src="./assets/gifs/profile.gif" alt="Profile Demo" width="100%" />
  </p>
</details>

## Tech Stack

- Vue 3.5
- Vue Router 4
- Pinia
- Axios
- PrimeVue 4.5 + PrimeIcons
- Tailwind CSS 4
- Vite 6

## System Highlights

- All dashboard routes are nested under `/dashboard/:userId`. The route guard enforces that
  `:userId` matches the authenticated user — URL param tampering silently redirects rather
  than showing an error.
- The Pinia auth store persists the bearer token in localStorage and hydrates user state on
  page refresh before any ownership check runs.
- A single Axios instance handles all API calls. Bearer token attachment and global 401
  handling (clear auth, redirect to login with `sessionExpired=1`) are wired up once via
  interceptors at app initialization.
- Loading states across all pages use a shared `StackedSkeleton` component powered by
  PrimeVue's Skeleton, keeping skeleton patterns consistent without per-page boilerplate.
- The UI system is built on a shared CSS layer (Tailwind + custom `@layer components`) that
  defines `.btn-primary`, `.form-card`, `.stat-card`, `.alert-*`, and layout shell classes.
  PrimeVue components are styled through these same classes for visual consistency.

## Project Structure
```text
vaultly-frontend/
├── assets/
│   ├── gifs/             # Animated GIFs for documentation
│   └── screenshots/      # Static images for documentation
├── router/
│   └── index.js          # Route definitions and navigation guards
└── src/
  ├── assets/
  │   └── main.css      # Global styles and Tailwind component layer
    ├── components/
    │   ├── ui/
    │   │   ├── FormCard.vue
    │   │   ├── PageWrapper.vue
    │   │   ├── SectionHeader.vue
    │   │   ├── StackedSkeleton.vue
    │   │   ├── StatCard.vue
    │   │   └── UserAvatarMenu.vue
    │   ├── Beneficiaries.vue
    │   ├── ChangePassword.vue
    │   ├── ChangePin.vue
    │   ├── DashBoard.vue
    │   ├── Deposit.vue
    │   ├── Home.vue
    │   ├── LogIn.vue
    │   ├── NotFound.vue
    │   ├── Profile.vue
    │   ├── SetPin.vue
    │   ├── SignUp.vue
    │   ├── TransactionHistory.vue
    │   ├── Transfer.vue
    │   └── Withdraw.vue
    ├── composables/
    │   └── useInputNormalization.js   # Strips non-digits and enforces max length on inputs
    ├── stores/
    │   └── auth.js        # Token persistence, user state, balance updates
    ├── utils/
    │   └── api.js         # Axios instance, interceptors, base URL resolution
    ├── App.vue
    └── main.js
```

## Architecture Deep Dive

### Routing and Access Control

Dashboard routes are nested under `/dashboard/:userId` and carry `meta: { requiresAuth: true }`.

The navigation guard in `router/index.js` handles four cases in order:

1. Unauthenticated access to a protected route → redirect to Login
2. Token present but user state empty (page refresh) → hydrate via `fetchDashboard()`, then proceed
3. Authenticated user hitting a Login or Signup page → redirect to their dashboard
4. `:userId` param does not match the authenticated user's ID → silently correct the URL

### State and Authentication

The Pinia auth store (`src/stores/auth.js`) holds the bearer token (read from and persisted to
localStorage), the current user payload, and helper actions: `fetchDashboard`, `fetchBalance`,
`updateBalance`, `clearAuth`.

`isAuthenticated` is a computed getter over the token — no server call needed to check session
status in the guard.

### API Layer

The Axios instance in `src/utils/api.js` resolves its base URL from `VITE_API_BASE_URL` at
build time, falling back to the deployed API URL if the variable is absent or empty.

Interceptors are initialized once at app startup via `initApiInterceptors(router)`:

- Request interceptor: reads the current token from the auth store and attaches it as a
  `Bearer` header.
- Response interceptor: on 401 with a token present, clears auth state and redirects to Login
  with `?sessionExpired=1`.

### UI Patterns

- PrimeVue for dialogs, toasts, confirm dialogs, menus, skeletons, and password inputs.
- Toast (top-right) is the standard output for async operation results.
- `StackedSkeleton` wraps PrimeVue's Skeleton with layout props, used consistently across all
  loading states.
- All forms surface validation errors inline (field-level) for client-side failures, and via
  toast for network or server errors.

## Prerequisites

- Node.js 18+
- npm 9+
- A running Vaultly backend API (local or deployed)

## Scripts
```bash
npm run dev      # start local dev server
npm run build    # production build
npm run preview  # preview production build locally
```

## Development Workflow

1. Start the backend API first.
2. Create `.env` in the project root and set `VITE_API_BASE_URL` (see below).
3. Run the frontend with `npm run dev`.
4. Walk through the full user journey to verify end-to-end behavior:
   - register and log in
   - set transaction PIN
   - deposit funds
   - transfer to another account and to a saved beneficiary
   - withdraw
   - check transaction history
   - update profile and profile picture

### Environment Variables

Create a `.env` file in the project root:
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

For production, set this to your deployed backend API endpoint. If the variable is absent,
the client falls back to the deployed Render API URL hardcoded in `src/utils/api.js`.

## Build and Deployment Notes

- Build output is generated by Vite into `dist/`.
- Frontend is currently deployed to Vercel.
- Ensure the backend `CORS_ALLOWED_ORIGINS` includes your Vercel domain before deploying.

## Known Constraints

- Requires a reachable backend API to function — there is no offline or mock mode.
- Free-tier backend hosting introduces cold-start delays on first request after idle.
- Session expiry redirects to Login by design. Clearing localStorage and logging in again
  resolves stale-token issues.
- The client expects backend validation errors in Laravel's standard structure
  (`{ errors: { field: ["message"] } }` or the custom `{ status, msg }` envelope used in
  this API).

## FAQ and Troubleshooting

### CORS errors in the browser

- Confirm `CORS_ALLOWED_ORIGINS` on the backend includes your frontend origin.
- Confirm `VITE_API_BASE_URL` points to the `/api` path, not just the root domain.

### Requests fail with 401 immediately after login

- Clear `access_token` from localStorage (DevTools → Application → Local Storage).
- Log in again to get a fresh token.

### Profile picture not updating after upload

- Hard refresh (Ctrl+Shift+R) to clear cached responses.
- Verify the backend Cloudinary configuration is valid and the upload endpoint is reachable.

## License

This project is for educational and portfolio/demo purposes.

## Future Improvements

- Add automated frontend tests covering key transaction and auth paths.
- Expand transaction filtering and search controls.
- Add account activity insights or basic analytics on the dashboard.
- Improve accessibility coverage and keyboard-navigation feedback.

## Author

Built by [SlinkyCollins](https://github.com/SlinkyCollins) as a full-stack portfolio project.