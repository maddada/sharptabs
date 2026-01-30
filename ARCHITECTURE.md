# Sharp Tabs Architecture

## Overview

Sharp Tabs is a Chrome extension for advanced tab management. The project is organized as a monorepo using pnpm workspaces and Turborepo for build orchestration.

## Monorepo Structure

```
sharptabs/
├── apps/
│   ├── extension/          # Chrome extension (main product)
│   └── website/            # Marketing website
├── packages/
│   ├── backend/            # Convex backend
│   └── shared/             # Shared types and configs
├── turbo.json              # Turborepo configuration
├── pnpm-workspace.yaml     # pnpm workspace config
└── package.json            # Root package.json
```

## Apps

### `apps/extension` - Chrome Extension

The main Chrome extension built with:

- **React 19** with React Compiler for optimal performance
- **TypeScript** for type safety
- **Vite** for fast builds and HMR
- **Tailwind CSS** + **shadcn/ui** for styling
- **Zustand** for state management

Key directories:
```
apps/extension/
├── public/
│   ├── manifest.template.json  # Extension manifest template
│   └── icons/                  # Extension icons
├── src/
│   ├── components/             # React components
│   ├── pages/                  # Entry points (Popup, Sidebar, Settings)
│   ├── service_worker/         # Background service worker
│   ├── providers/              # React context providers
│   ├── stores/                 # Zustand stores
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   └── types/                  # TypeScript types
└── dist/                       # Build output (load this in Chrome)
```

Entry points:
- `PopupPage.tsx` - Extension popup (Alt+T)
- `SidebarPage.tsx` - Side panel UI
- `SettingsPage.tsx` - Options page
- `service_worker.ts` - Background script

### `apps/website` - Marketing Website

Built with [Astro](https://astro.build/) for the public-facing website.

## Packages

### `packages/backend` - Convex Backend

Serverless backend using [Convex](https://convex.dev/):

- Real-time data sync
- AI proxy (Gemini API)
- User authentication
- Stripe payment integration
- Analytics

Key files:
```
packages/backend/convex/
├── geminiProxy.ts    # Gemini AI API proxy
├── stripe.ts         # Payment handling
├── auth.ts           # Authentication
├── users.ts          # User management
└── http.ts           # HTTP endpoints
```

### `packages/shared` - Shared Code

Shared types and configurations used across apps:

- Gemini configuration
- Common TypeScript types

## Key Technologies

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Zustand | State management |
| Convex | Backend/database |
| Firebase | Authentication |
| Stripe | Payments |
| Turborepo | Monorepo build system |
| pnpm | Package manager |

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Popup   │    │ Sidebar  │    │ Service Worker   │  │
│  │  (React) │    │ (React)  │    │ (Background)     │  │
│  └────┬─────┘    └────┬─────┘    └────────┬─────────┘  │
│       │               │                    │            │
│       └───────────────┴────────────────────┘            │
│                       │                                  │
│              ┌────────┴────────┐                        │
│              │  Zustand Store  │                        │
│              │  (chrome.storage)│                        │
│              └────────┬────────┘                        │
└───────────────────────┼─────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐      ┌──────────────┐
    │   Convex     │      │   Firebase   │
    │   Backend    │      │   Auth       │
    └──────────────┘      └──────────────┘
            │
            ▼
    ┌──────────────┐
    │   Gemini AI  │
    │   Stripe     │
    └──────────────┘
```

## Build System

Turborepo manages the build pipeline:

```bash
pnpm build          # Build all packages
pnpm dev            # Start all in dev mode
pnpm dev:extension  # Start extension only
```

Build outputs:
- Extension → `apps/extension/dist/`
- Website → `apps/website/dist/`
- Backend → Deployed to Convex

## Extension Manifest

The manifest uses build-time variable injection:

1. `manifest.template.json` contains placeholders (`__EXTENSION_KEY__`, `__OAUTH_CLIENT_ID__`)
2. Vite plugin reads `.env.local` and replaces placeholders
3. `manifest.json` is generated in `public/` (gitignored)

This allows keeping credentials private while sharing the template.
