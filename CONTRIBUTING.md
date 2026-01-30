# Contributing to Sharp Tabs

Thank you for your interest in contributing to Sharp Tabs!

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18.8.0
- [pnpm](https://pnpm.io/) 10.12.4 or later

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/maddada/sharptabs.git
cd sharptabs
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example environment files:

```bash
# For the extension
cp apps/extension/.env.example apps/extension/.env.local

# For backend features (optional)
cp apps/extension/.env.local.example apps/extension/.env.local
```

Edit `apps/extension/.env.local` with your own values.

### 4. Set up Chrome OAuth credentials (required for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Create an OAuth 2.0 Client ID (Chrome Extension type)
4. Add your extension ID to the authorized origins
5. Copy the Client ID to `VITE_OAUTH_CLIENT_ID` in your `.env.local`

### 5. Get your extension key (optional but recommended)

1. Build and load the extension once (see below)
2. Go to `chrome://extensions`
3. Enable Developer mode
4. Find your extension and copy its key
5. Add it to `VITE_EXTENSION_KEY` in your `.env.local`

## Development

### Run the extension in development mode

```bash
pnpm dev:extension
```

This starts Vite in watch mode. Load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist`

### Build for production

```bash
pnpm build
```

### Run tests

```bash
pnpm test:extension
```

### Lint code

```bash
pnpm lint:extension
```

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed project structure.

## Backend Services

Sharp Tabs uses several backend services for premium features:

- **Convex** - Real-time database and serverless functions
- **Firebase** - Authentication
- **Stripe** - Payments

The extension works without these services for core functionality (tab management, suspend, workspaces). AI features and sync require the backend.

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes
6. Push to your fork
7. Open a Pull Request

## Code Style

- TypeScript for all code
- Use `type` over `interface` (see `.claude/rules/typescript-best-practices.md`)
- Named exports over default exports
- Keep files under ~250 lines when possible

## Questions?

Open an issue on GitHub if you have questions or run into problems.
