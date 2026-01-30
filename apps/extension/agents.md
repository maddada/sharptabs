# Agents Guide

This document provides a comprehensive guide for AI assistants to understand the structure, technologies, and key components of this Chrome extension project.

## 1. Project Overview

This is an advanced Chrome extension for tab management. It's designed to help users organize, group, and manage their browser tabs efficiently. The extension provides a custom user interface that replaces the browser's default tab bar, offering enhanced features.

### Key Features:

- **Drag-and-Drop:** Intuitive organization of tabs and tab groups.
- **Tab Grouping:** Create, rename, and manage custom groups.
- **Session Management:** Save and restore entire browser windows as sessions.
- **Customization:** Personalize the appearance with themes, colors, and background images.
- **Settings Sync:** Sync user settings across different devices using Convex.
- **Context Menus:** Customizable right-click menus on tabs and tab groups for enhanced productivity.
- **Search and Filter:** Quickly find specific tabs by typing anywhere in the extension.
- **Up and Down Arrows navigation:** Navigate through tabs and groups using the up and down arrows.

## 2. Core Technologies

The project is built with a modern web stack:

- **Framework**: React (`^18.2.0`)
- **Language**: TypeScript (`^5.2.2`)
- **Styling**: Tailwind CSS (`^3.4.17`) with shadcn/ui components for a consistent and modern look.
- **State Management**: Zustand (`^4.5.2`) for efficient and lightweight global state management.
- **Build Tool**: Vite (`^5.4.18`) for fast development and optimized builds.
- **Backend (for Sync)**: Convex (`^1.23.0`) for real-time data synchronization of user settings.
- **Linting & Formatting**: ESLint (`^9.0.0`) and Prettier (`^3.5.3`) to maintain code quality and consistency.

## 3. Project Structure

The project is organized into the following key directories:

- `src/`: Contains the main source code for the extension.
    - `components/`: Reusable React components, categorized by feature.
        - `dialogs/`: Dialog components for user interactions (e.g., renaming a group).
        - `sessions/`: Components related to session management (`SessionManagementDialog.tsx`).
        - `settings/`: Components for the extensive settings page.
        - `tab-list-items/`: Components for individual tabs (`TabItem.tsx`) and groups (`GroupItem.tsx`).
        - `tabs-manager/`: The core component for managing and displaying tabs.
        - `ui/`: Base shadcn/ui components (Button, Dialog, etc.).
    - `stores/`: Zustand stores for global state management. This is central to the app's architecture.
    - `pages/`: Top-level pages for the extension (e.g., `PopupPage.tsx`, `SettingsPage.tsx`).
    - `utils/`: Utility functions, with a `tabs/` subdirectory for specialized tab-related logic.
    - `service_worker.ts`: The extension's background script.
    - `content_script.ts`: Injected into web pages for communication.
- `convex/`: Contains the backend schema and functions for Convex, used for features like settings sync.
- `public/`: Static assets, including the crucial `manifest.json` and extension icons.
- `dist/`: The build output directory, which is loaded into Chrome as the unpacked extension.

## 4. Key Components and Logic

Understanding these files is crucial for working on the codebase.

### State Management (Zustand)

The state is managed across several stores, which are critical for understanding data flow:

- **`stores/tabsStore.ts`**: The most important store. It manages the state of all tabs and groups, including their order, parent-child relationships, and properties. Any operation that modifies the tab structure will interact with this store.
- **`stores/settingsStore.ts`**: Manages all user-configurable settings, from theme colors to behavioral toggles.
- **`stores/selectionStore.ts`**: Manages the selection of tabs and groups, enabling batch operations (e.g., closing multiple selected tabs).
- **`stores/authStore.ts`**: Handles user authentication state, primarily for syncing settings with Convex.

### Core Frontend Components

- **`components/tabs-manager/TabsManager.tsx`**: This is the heart of the UI. It orchestrates the entire tab management interface, rendering the list of tabs and groups, handling drag-and-drop logic (using `dnd-kit`), and responding to user interactions.
- **`components/tab-list-items/TabItem.tsx`**: Renders a single tab. It displays the tab's title, favicon, and handles user interactions like clicking, closing, and context menus.
- **`components/tab-list-items/GroupItem.tsx`**: Renders a tab group, including its name, color, and collapse/expand functionality.

### Chrome Extension Core

- **`public/manifest.json`**: The manifest file is the entry point of the extension. It defines permissions (e.g., `tabs`, `storage`), background scripts, UI pages (popup, settings), and content scripts.
- **`src/service_worker.ts`**: The background service worker is a persistent script that listens to browser events from the Chrome API. It's responsible for:
    - Listening to tab events (creation, updates, removal) and updating the `tabsStore`.
    - Handling messages from other parts of the extension.
    - Managing the extension's core, non-UI logic.

### Backend and Data Sync

- **`convex/`**: This directory defines the backend data models (`schema.ts`) and serverless functions (`users.ts`, `stripe.ts`) for syncing data.
- **`utils/convex.ts`**: The Convex client setup for the frontend, allowing React components to interact with the backend.
- **`components/settings/SettingsSyncCloud.tsx`**: The UI component that allows users to log in and manage their cloud-synced settings.

## 5. Codebase Rules and Conventions

To maintain consistency and quality, please adhere to the following rules when contributing to the codebase:

### **React and Component Patterns**

- **React Compiler:** This project uses the React Compiler (`babel-plugin-react-compiler`). Therefore, you should **avoid** using manual memoization hooks like `useMemo`, `useCallback`, and `React.memo`. The compiler handles these optimizations automatically.
- **Component Declaration:** Declare React components using the `function` keyword (e.g., `export function MyComponent() {}`) instead of `const` arrow functions. This is the established convention in the project.

### **State Management**

- **Zustand:** All global state is managed by Zustand. **Do not use prop drilling.** Instead, access and update state directly from the relevant Zustand store (e.g., `useTabsStore`, `useSettingsStore`).
- **Zustand Actions:** When calling Zustand actions from outside of a React component (e.g., in a utility function), use `useStore.getState().actions.myAction()` to access the store's actions.

### **File and Directory Structure**

- **Component-Specific Logic:** For complex components (e.g., `TabsManager`), create `helpers` and `hooks` subdirectories to encapsulate related logic. This keeps the main component file focused on rendering.
- **Event Handlers:** For components with significant event handling, create a separate `[ComponentName]Handlers.ts` file to house these functions (e.g., `TabItemHandlers.ts`).
- **Utility Functions:** Place generic, reusable utility functions in the `src/utils` directory. If a utility is specific to a certain feature area (e.g., tabs), create a subdirectory within `utils` (e.g., `src/utils/tabs`).

### **Code Style and Naming**

- **Handler Naming:** Name event handler functions with a `handle` prefix (e.g., `handleTabClick`, `handleDragEnd`).
- **Asynchronous Operations:** Use `async/await` for all asynchronous operations, especially when interacting with the Chrome API.
- **Error Handling:** Wrap all Chrome API calls in `try...catch` blocks to gracefully handle potential errors.
- **Styling:** Use Tailwind CSS for all styling. For conditional classes, use the `cn` utility function (located in `src/utils/cn.ts`).

### **Imports**

- **Absolute Imports:** Use absolute imports with the `@/` alias (e.g., `import { MyComponent } from '@/components/MyComponent';`) instead of relative imports. This makes it easier to move files around without breaking imports.

### **Type Safety**

- **TypeScript:** All new code must be strongly typed using TypeScript. Refer to the `src/types/` directory for existing type definitions.

## 6. Build and Run

To build and run the extension, use the following commands:

- `pnpm install`: Install dependencies.
- `pnpm dev`: Start the development server with hot reloading.
- `pnpm build`: Build the extension for production.

### Loading in Chrome:

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked" and select the `dist/` directory.
