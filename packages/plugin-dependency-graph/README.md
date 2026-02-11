# Gitton Plugin: Dependency Graph

Visualize import/require dependencies between files in your project.

## Features

- **Interactive Graph**: View your project's file dependencies as an interactive node graph
- **Click to Focus**: Click on any file node to highlight its dependencies and dependents
- **Search**: Filter files by name or path
- **Layout Toggle**: Switch between horizontal and vertical layouts
- **Dark Mode Support**: Automatically adapts to your system theme

## Supported File Types

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`)
- Vue (`.vue`)
- Svelte (`.svelte`)

## Import Detection

The analyzer detects the following import patterns:

- ES6 imports: `import x from './path'`
- Named imports: `import { x } from './path'`
- Type imports: `import type { x } from './path'`
- Dynamic imports: `import('./path')`
- CommonJS: `require('./path')`

## Settings

Configure the analyzer in Settings > Dependency Graph:

- **Include Paths**: Directories to analyze (default: `src`)
- **Exclude Paths**: Directories to skip (default: `node_modules, dist, build, .git`)
- **Show External Dependencies**: Include npm packages in the graph

## Installation

1. Download the plugin or clone this repository
2. In Gitton, go to Settings > Plugins
3. Click "Install from Folder" and select the plugin directory
4. Enable the plugin

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT

