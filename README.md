# Sharp Tabs

A powerful Chrome extension for tab management with instant search, intelligent tab suspending, AI features, session backups, workspaces, and beautiful themes.

**[Install on sharptabs.com](https://sharptabs.com)** | **[r/SharpTabs](https://reddit.com/r/SharpTabs)**


https://github.com/user-attachments/assets/41a499e9-5743-4cf5-bd18-0220bd55d1a7


## Features

### Search
- **Instant Search** - Start typing anywhere for immediate results
- **Keyboard Navigation** - Arrow keys or Tab/Shift+Tab to navigate
- **Quick Access** - Alt+T to open popup, type, select, Enter

### Tab Suspending
- **Auto-Suspend** - Suspend tabs after configurable inactivity time
- **Smart Whitelist** - Configure which sites to never suspend
- **Screenshot Preview** - See suspended tabs at a glance
- **Native Discarding** - Uses Chrome's native tab discarding for maximum RAM savings

### AI Features
- **Tab Grouping** - Intelligently organize tabs with customizable prompts
- **Tab Cleanup** - Identifies tabs you might want to close
- **Group Naming** - Auto-names new groups

### Session Backups
- **Auto-Backup** - Automatic backups every 10 minutes when tabs change
- **Granular Restore** - Restore sessions, windows, groups, or individual tabs
- **Cross-Browser** - Export and import sessions between browsers

### Workspaces
- Organize tabs into different areas (Personal, Work, etc.)
- Drag tabs/groups onto workspace icons to move them
- Assign hotkeys to workspaces

### Customization
- Themes and background images/gradients
- Compatible with [tweakcn.com](https://tweakcn.com) for unlimited themes
- Custom CSS support
- Compact pinned tabs mode
- Customizable context menu

### More
- Bulk links opener for Jira, Linear, TestRail, or other IDs
- Duplicate tab detection
- Multi-select and drag & drop
- Recent Tabs Navigation (Alt+Tab for browser tabs)
- Two modes: Popup for quick actions, Sidebar for involved usage

## Development

This is a monorepo using pnpm and Turborepo.

```bash
# Install dependencies
pnpm install

# Development build (extension)
pnpm dev:extension

# Production build
pnpm build
```

See [apps/extension/README.md](apps/extension/README.md) for detailed development instructions.

## Tech Stack

- React 19 with React Compiler
- TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Zustand
- Convex (backend)
- Chrome Extension APIs

## Release Notes

See [r/SharpTabs](https://reddit.com/r/SharpTabs) for release notes and updates.
