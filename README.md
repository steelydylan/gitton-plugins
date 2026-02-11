# Gitton Plugins Monorepo

This is a monorepo for Gitton's official plugins and TypeScript type definitions.

## Packages

| Package | Description | npm |
|---|---|---|
| [@gitton-dev/cli](./packages/cli) | Plugin management CLI | [![npm](https://img.shields.io/npm/v/@gitton-dev/cli)](https://www.npmjs.com/package/@gitton-dev/cli) |
| [@gitton-dev/types](./packages/types) | Gitton Plugin TypeScript Type Definitions | [![npm](https://img.shields.io/npm/v/@gitton-dev/types)](https://www.npmjs.com/package/@gitton-dev/types) |
| [@gitton-dev/plugin-dependency-graph](./packages/plugin-dependency-graph) | Visualize file dependencies | [![npm](https://img.shields.io/npm/v/@gitton-dev/plugin-dependency-graph)](https://www.npmjs.com/package/@gitton-dev/plugin-dependency-graph) |
| [@gitton-dev/plugin-git-hooks](./packages/plugin-git-hooks) | Git hooks management UI | [![npm](https://img.shields.io/npm/v/@gitton-dev/plugin-git-hooks)](https://www.npmjs.com/package/@gitton-dev/plugin-git-hooks) |
| [@gitton-dev/plugin-github-actions](./packages/plugin-github-actions) | Display and execute GitHub Actions | [![npm](https://img.shields.io/npm/v/@gitton-dev/plugin-github-actions)](https://www.npmjs.com/package/@gitton-dev/plugin-github-actions) |

## Plugin Installation

You can install plugins using the CLI:

```bash
# Install the CLI
npm install -g @gitton-dev/cli

# Install a plugin
gitton install github-actions

# List installed plugins
gitton list

# Uninstall a plugin
gitton uninstall github-actions
```

## Plugin Development

Create plugins to extend Gitton. See `@gitton-dev/types` for TypeScript definitions.

### Plugin Structure

```
my-gitton-plugin/
├── package.json        # Plugin manifest in "gitton" field
├── ui/
│   └── sidebar.html    # UI extension HTML
└── ...
```

### package.json Example

```json
{
  "name": "gitton-plugin-example",
  "version": "1.0.0",
  "gitton": {
    "displayName": "Example Plugin",
    "version": "1.0.0",
    "description": "An example plugin for Gitton",
    "permissions": ["ui:sidebar", "settings:read", "settings:write"],
    "extensionPoints": {
      "sidebar": {
        "entry": "ui/sidebar.html",
        "icon": "Puzzle",
        "position": "bottom"
      }
    }
  }
}
```

### Plugin API

Access the `gitton` global object in your plugin HTML:

```typescript
// Settings
const value = await gitton.settings.get('myKey');
await gitton.settings.set('myKey', { foo: 'bar' });

// Notifications
gitton.ui.showNotification('Hello!', 'info');

// Open external URL
await gitton.ui.openExternal('https://github.com');

// HTTP requests
const result = await gitton.network.fetch('https://api.example.com/data');

// GitHub CLI
const prList = await gitton.gh.run(['pr', 'list', '--json', 'number,title']);

// File system (within repo only)
const content = await gitton.fs.readFile('.gitignore');
await gitton.fs.writeFile('temp.txt', 'content');
```

### Permissions

| Permission | Description |
|------------|-------------|
| `ui:sidebar` | Add sidebar panel |
| `ui:settings` | Add settings tab |
| `ui:repositorySettings` | Add repository settings tab |
| `ui:contextMenu` | Add context menu items |
| `settings:read` | Read plugin settings |
| `settings:write` | Write plugin settings |
| `network:fetch` | Make HTTP requests |
| `git:read` | Read Git information |
| `git:write` | Execute Git operations |
| `git:hooks` | Register Git hooks |

### Marketplace

Publish your plugin on GitHub with the `gitton-plugin` topic to appear in the Gitton marketplace.

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Development mode
pnpm dev

# Clean build artifacts
pnpm clean
```

## Publishing

Tags with `v*` pattern will trigger automatic npm publish via GitHub Actions.

```bash
# Bump version and create tag
pnpm -r exec npm version patch
git add -A && git commit -m "chore(release): bump version"
git tag v1.0.1
git push origin main --tags
```

Manual publish:

```bash
pnpm --filter @gitton-dev/types publish --access public
pnpm --filter @gitton-dev/plugin-dependency-graph publish --access public
pnpm --filter @gitton-dev/plugin-git-hooks publish --access public
pnpm --filter @gitton-dev/plugin-github-actions publish --access public
```

## License

MIT
