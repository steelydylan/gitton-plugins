/**
 * Gitton Plugin API Type Definitions
 *
 * This file provides TypeScript type definitions for developing Gitton plugins.
 * Include this file in your plugin project to get full IntelliSense support.
 *
 * @packageDocumentation
 */

/**
 * Plugin permissions that can be requested in package.json
 */
export type PluginPermission =
  | 'ui:sidebar'
  | 'ui:settings'
  | 'ui:repositorySettings'
  | 'ui:contextMenu'
  | 'settings:read'
  | 'settings:write'
  | 'network:fetch'
  | 'git:read'
  | 'git:write'
  | 'git:hooks'

/**
 * Git hook types that plugins can register
 */
export type HookType =
  | 'preCommit'
  | 'postCommit'
  | 'preCheckout'
  | 'postCheckout'
  | 'prePush'
  | 'postPush'
  | 'preMerge'
  | 'postMerge'
  | 'onRepositoryOpen'
  | 'onRepositoryClose'

/**
 * Notification types for UI notifications
 */
export type NotificationType = 'info' | 'warning' | 'error'

/**
 * Context menu target types
 */
export type ContextMenuTarget = 'commit' | 'file' | 'branch' | 'tag' | 'stash'

/**
 * Theme setting
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Sidebar extension configuration
 */
export interface SidebarExtension {
  /** HTML file path relative to plugin root */
  entry: string
  /** Lucide icon name (e.g., "Puzzle", "Settings", "GitBranch") */
  icon?: string
  /** Position in sidebar */
  position?: 'top' | 'bottom'
}

/**
 * Settings tab extension configuration
 */
export interface SettingsTabExtension {
  /** HTML file path relative to plugin root */
  entry: string
  /** Tab label displayed in settings */
  label: string
}

/**
 * Repository settings extension configuration
 */
export interface RepositorySettingsExtension {
  /** HTML file path relative to plugin root */
  entry: string
  /** Tab label displayed in repository settings */
  label: string
  /** Lucide icon name */
  icon?: string
}

/**
 * Context menu extension configuration
 */
export interface ContextMenuExtension {
  /** Unique identifier for the menu item */
  id: string
  /** Display label for the menu item */
  label: string
  /** Contexts where this menu item should appear */
  context: ContextMenuTarget[]
}

/**
 * Extension points configuration
 */
export interface ExtensionPoints {
  sidebar?: SidebarExtension
  settingsTab?: SettingsTabExtension
  repositorySettings?: RepositorySettingsExtension
  contextMenu?: ContextMenuExtension[]
}

/**
 * Types of resources that can be loaded from external domains
 */
export type AllowedDomainType = 'frame' | 'script' | 'style' | 'font' | 'connect'

/**
 * External domain that the plugin needs access to
 */
export interface AllowedDomain {
  /** Domain URL (e.g., "https://unpkg.com") */
  domain: string
  /** Types of resources to allow from this domain */
  types: AllowedDomainType[]
  /** Human-readable description for settings UI */
  description: string
}

/**
 * Plugin security settings
 */
export interface PluginSecurity {
  /** External domains that this plugin needs to load resources from */
  allowedDomains?: AllowedDomain[]
}

/**
 * Plugin manifest (gitton field in package.json)
 */
export interface PluginManifest {
  /** Display name shown in Gitton UI */
  displayName: string
  /** Plugin version (semver) */
  version: string
  /** Plugin description */
  description?: string
  /** Plugin author */
  author?: string
  /** Plugin icon (Lucide icon name) */
  icon?: string
  /** Minimum Gitton version required */
  minGittonVersion?: string
  /** Permissions required by the plugin */
  permissions: PluginPermission[]
  /** Git hooks the plugin wants to register */
  hooks?: HookType[]
  /** UI extension points */
  extensionPoints?: ExtensionPoints
  /** JSON Schema for plugin configuration */
  configSchema?: Record<string, unknown>
  /** Security settings including allowed external domains */
  security?: PluginSecurity
}

/**
 * Context provided to hooks
 */
export interface HookContext {
  /** Repository path */
  repoPath: string
  /** Current branch name */
  currentBranch?: string
  /** Additional data depending on hook type */
  data: Record<string, unknown>
}

/**
 * Result returned from hook handlers
 */
export interface HookResult {
  /** Set to false to cancel the operation */
  proceed: boolean
  /** Message to show to the user */
  message?: string
  /** Modified data to pass to subsequent hooks/operations */
  modifiedData?: Record<string, unknown>
}

/**
 * Context provided to plugin UI
 */
export interface GittonContext {
  /** Current repository path (null if no repo is open) */
  repoPath: string | null
  /** Current theme */
  theme: Theme
}

/**
 * Network fetch result
 */
export interface FetchResult {
  /** HTTP status code */
  status: number
  /** HTTP status text */
  statusText: string
  /** Response headers */
  headers: Record<string, string>
  /** Response body as text */
  body: string
}

/**
 * GitHub CLI execution result
 */
export interface GhResult {
  /** Exit code */
  exitCode: number
  /** Standard output */
  stdout: string
  /** Standard error */
  stderr: string
}

/**
 * Directory entry from readdir
 */
export interface DirEntry {
  /** Entry name */
  name: string
  /** Whether it's a directory */
  isDirectory: boolean
  /** Whether it's a file */
  isFile: boolean
}

/**
 * Settings API for reading and writing plugin settings
 */
export interface SettingsAPI {
  /**
   * Get a setting value
   * @param key - Setting key
   * @returns The setting value, or undefined if not set
   */
  get(key: string): Promise<unknown>

  /**
   * Set a setting value
   * @param key - Setting key
   * @param value - Setting value (must be JSON-serializable)
   */
  set(key: string, value: unknown): Promise<void>

  /**
   * Get all settings for this plugin
   * @returns Object containing all settings
   */
  getAll(): Promise<Record<string, unknown>>
}

/**
 * UI API for interacting with Gitton's user interface
 */
export interface UIAPI {
  /**
   * Show a notification to the user
   * @param message - Message to display
   * @param type - Notification type (default: 'info')
   */
  showNotification(message: string, type?: NotificationType): void

  /**
   * Open an external URL in the default browser
   * @param url - URL to open
   */
  openExternal(url: string): Promise<void>

  /**
   * Get the current theme
   * @returns Current theme setting
   */
  getTheme(): Promise<Theme>
}

/**
 * Network API for making HTTP requests
 */
export interface NetworkAPI {
  /**
   * Make an HTTP request
   * @param url - Request URL
   * @param options - Fetch options (method, headers, body, etc.)
   * @returns Response object
   */
  fetch(url: string, options?: RequestInit): Promise<FetchResult>
}

/**
 * GitHub CLI API
 */
export interface GhAPI {
  /**
   * Run a GitHub CLI command
   * @param args - Command arguments (e.g., ['pr', 'list', '--json', 'number'])
   * @returns Command result
   * @example
   * const result = await gitton.gh.run(['pr', 'list', '--json', 'number,title']);
   * const prs = JSON.parse(result.stdout);
   */
  run(args: string[]): Promise<GhResult>
}

/**
 * File system API (restricted to repository directory)
 */
export interface FsAPI {
  /**
   * Read a file
   * @param path - File path relative to repository root
   * @returns File contents as string
   */
  readFile(path: string): Promise<string>

  /**
   * Write a file
   * @param path - File path relative to repository root
   * @param content - Content to write
   */
  writeFile(path: string, content: string): Promise<void>

  /**
   * List directory contents
   * @param path - Directory path relative to repository root
   * @returns Array of directory entries
   */
  readdir(path: string): Promise<DirEntry[]>

  /**
   * Check if a file or directory exists
   * @param path - Path relative to repository root
   * @returns True if exists
   */
  exists(path: string): Promise<boolean>

  /**
   * Delete a file
   * @param path - File path relative to repository root
   */
  unlink(path: string): Promise<void>

  /**
   * Change file permissions
   * @param path - File path relative to repository root
   * @param mode - Permission mode (e.g., 0o755)
   */
  chmod(path: string, mode: number): Promise<void>
}

/**
 * Main Gitton Plugin API
 *
 * This object is available as `window.gitton` in plugin HTML files.
 */
export interface GittonPluginAPI {
  /** Plugin ID assigned by Gitton */
  readonly pluginId: string

  /** Settings API */
  readonly settings: SettingsAPI

  /** UI API */
  readonly ui: UIAPI

  /** Network API */
  readonly network: NetworkAPI

  /** GitHub CLI API */
  readonly gh: GhAPI

  /** File system API */
  readonly fs: FsAPI

  /** Current context (updated when repository changes) */
  readonly context: GittonContext
}

/**
 * Context change event detail
 */
export interface ContextChangeEventDetail {
  repoPath: string | null
  theme: Theme
}

declare global {
  interface Window {
    /**
     * Gitton Plugin API
     *
     * Available in all plugin HTML files loaded by Gitton.
     *
     * @example
     * // Read a setting
     * const value = await gitton.settings.get('myKey');
     *
     * // Show a notification
     * gitton.ui.showNotification('Hello from plugin!', 'info');
     *
     * // Make an HTTP request
     * const result = await gitton.network.fetch('https://api.example.com/data');
     *
     * // Run GitHub CLI command
     * const prs = await gitton.gh.run(['pr', 'list', '--json', 'number']);
     */
    gitton: GittonPluginAPI
  }

  interface WindowEventMap {
    /**
     * Fired when the context changes (e.g., repository opened/closed, theme changed)
     */
    'gitton:contextchange': CustomEvent<ContextChangeEventDetail>
  }
}

export {}
