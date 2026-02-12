import * as monaco from 'monaco-editor'

// Monaco Editor worker paths will be handled by Vite
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco Environment for workers
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

// Track loaded files to avoid duplicates
const loadedFiles = new Set<string>()
let tsconfigPaths: Record<string, string[]> = {}
let tsconfigBaseUrl = '.'

// Language detection from file extension
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'json': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'mdx': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'svg': 'xml',
    'py': 'python',
    'rb': 'ruby',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'kt': 'kotlin',
    'swift': 'swift',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'sql': 'sql',
    'graphql': 'graphql',
    'gql': 'graphql',
    'dockerfile': 'dockerfile',
    'toml': 'ini',
    'ini': 'ini',
    'env': 'ini',
    'gitignore': 'ini',
  }
  return languageMap[ext] || 'plaintext'
}

// Editor instance
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let currentFilename = ''

// Apply theme helper
function applyTheme(theme: string) {
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs'
  monaco.editor.setTheme(monacoTheme)
}

// Load tsconfig.json and configure Monaco
async function loadTsConfig(): Promise<void> {
  if (typeof window.gitton === 'undefined') return

  try {
    const tsconfigContent = await window.gitton.fs.readFile('tsconfig.json')
    const jsonContent = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    const tsconfig = JSON.parse(jsonContent)
    const opts = tsconfig.compilerOptions || {}

    // Store paths for resolution
    tsconfigPaths = opts.paths || {}
    tsconfigBaseUrl = opts.baseUrl || '.'

    // Convert tsconfig options to Monaco options
    const compilerOptions: monaco.languages.typescript.CompilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      allowJs: opts.allowJs ?? true,
      checkJs: opts.checkJs ?? false,
      jsx: opts.jsx === 'react-jsx' ? monaco.languages.typescript.JsxEmit.ReactJSX :
           opts.jsx === 'preserve' ? monaco.languages.typescript.JsxEmit.Preserve :
           monaco.languages.typescript.JsxEmit.React,
      jsxImportSource: opts.jsxImportSource,
      esModuleInterop: opts.esModuleInterop ?? true,
      allowSyntheticDefaultImports: opts.allowSyntheticDefaultImports ?? true,
      strict: opts.strict ?? false,
      noImplicitAny: opts.noImplicitAny ?? false,
      skipLibCheck: true,
      baseUrl: opts.baseUrl,
      paths: opts.paths,
      typeRoots: opts.typeRoots,
      types: opts.types
    }

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)

    console.log('[Monaco] Loaded tsconfig.json', { paths: tsconfigPaths, baseUrl: tsconfigBaseUrl })
  } catch (e) {
    console.log('[Monaco] No tsconfig.json found, using defaults')
    const defaultOptions: monaco.languages.typescript.CompilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      allowJs: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      skipLibCheck: true
    }
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(defaultOptions)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(defaultOptions)
  }
}

// Add a file to Monaco's type system
async function addFileToMonaco(filePath: string, content: string): Promise<void> {
  if (loadedFiles.has(filePath)) return
  loadedFiles.add(filePath)

  const uri = `file:///${filePath}`
  monaco.languages.typescript.typescriptDefaults.addExtraLib(content, uri)
  monaco.languages.typescript.javascriptDefaults.addExtraLib(content, uri)
}

// Recursively load .d.ts files from a directory
async function loadDtsFromDir(dirPath: string, maxDepth = 5, currentDepth = 0): Promise<void> {
  if (typeof window.gitton === 'undefined') return
  if (currentDepth > maxDepth) return

  try {
    const entries = await window.gitton.fs.readdir(dirPath)

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue

      const fullPath = dirPath ? `${dirPath}/${entry.name}` : entry.name

      if (entry.isDirectory) {
        // Skip some heavy directories
        if (entry.name === 'test' || entry.name === 'tests' ||
            entry.name === '__tests__' || entry.name === 'examples' ||
            entry.name === 'docs' || entry.name === '.git') continue
        await loadDtsFromDir(fullPath, maxDepth, currentDepth + 1)
      } else if (entry.name.endsWith('.d.ts')) {
        try {
          const content = await window.gitton.fs.readFile(fullPath)
          if (content.length < 500 * 1024) { // Skip files > 500KB
            await addFileToMonaco(fullPath, content)
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}

// Load package's type definitions
async function loadPackageTypes(packageName: string): Promise<void> {
  if (typeof window.gitton === 'undefined') return

  // Try @types package first
  const typesPath = `node_modules/@types/${packageName}`
  const typesExists = await window.gitton.fs.exists(typesPath)

  if (typesExists) {
    await loadDtsFromDir(typesPath, 3)
    console.log(`[Monaco] Loaded @types/${packageName}`)
    return
  }

  // Try package's own types
  const packagePath = `node_modules/${packageName}`
  const packageExists = await window.gitton.fs.exists(packagePath)

  if (packageExists) {
    // Read package.json to find types entry
    try {
      const pkgJsonContent = await window.gitton.fs.readFile(`${packagePath}/package.json`)
      const pkgJson = JSON.parse(pkgJsonContent)
      const typesFile = pkgJson.types || pkgJson.typings

      if (typesFile) {
        const typesPath = `${packagePath}/${typesFile}`
        if (await window.gitton.fs.exists(typesPath)) {
          const content = await window.gitton.fs.readFile(typesPath)
          await addFileToMonaco(typesPath, content)
          console.log(`[Monaco] Loaded types from ${packageName}`)
        }
      }
    } catch {
      // No types found
    }

    // Also load any .d.ts files in the package
    await loadDtsFromDir(packagePath, 2)
  }
}

// Load all type definitions from node_modules
async function loadAllNodeModulesTypes(): Promise<void> {
  if (typeof window.gitton === 'undefined') return

  console.log('[Monaco] Loading node_modules types...')

  // Priority packages to load first
  const priorityPackages = [
    'react', 'react-dom', 'node',
    'react-router-dom', 'react-i18next',
    'lucide-react', 'sonner'
  ]

  // Load priority packages
  for (const pkg of priorityPackages) {
    await loadPackageTypes(pkg)
  }

  // Load all @types packages
  try {
    const typesDir = 'node_modules/@types'
    if (await window.gitton.fs.exists(typesDir)) {
      const entries = await window.gitton.fs.readdir(typesDir)
      for (const entry of entries) {
        if (entry.isDirectory && !priorityPackages.includes(entry.name)) {
          await loadPackageTypes(entry.name)
        }
      }
    }
  } catch (e) {
    console.warn('[Monaco] Failed to load @types:', e)
  }

  console.log('[Monaco] Finished loading node_modules types')
}

// Resolve path alias (e.g., @/lib/utils -> src/lib/utils)
function resolvePathAlias(importPath: string): string | null {
  for (const [alias, targets] of Object.entries(tsconfigPaths)) {
    // Convert alias pattern to regex (e.g., "@/*" -> "^@/(.*)$")
    const aliasPattern = alias.replace('*', '(.*)')
    const regex = new RegExp(`^${aliasPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\(\\.\\*\\)', '(.*)')}$`)
    const match = importPath.match(regex)

    if (match) {
      const captured = match[1] || ''
      for (const target of targets) {
        const resolvedPath = target.replace('*', captured)
        const fullPath = tsconfigBaseUrl ? `${tsconfigBaseUrl}/${resolvedPath}` : resolvedPath
        return fullPath.replace(/^\.\//, '')
      }
    }
  }
  return null
}

// Load a source file and its dependencies
async function loadSourceFile(filePath: string, depth = 0): Promise<void> {
  if (typeof window.gitton === 'undefined') return
  if (depth > 5) return // Limit recursion
  if (loadedFiles.has(filePath)) return

  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']

  for (const ext of extensions) {
    const fullPath = filePath + ext
    try {
      if (await window.gitton.fs.exists(fullPath)) {
        const content = await window.gitton.fs.readFile(fullPath)
        await addFileToMonaco(fullPath, content)

        // Parse imports and load them too
        const importRegex = /(?:import|export)\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g
        let match
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1]

          // Skip node_modules imports (handled separately)
          if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('~/')) {
            continue
          }

          // Resolve relative imports
          let resolvedPath: string
          if (importPath.startsWith('.')) {
            const dir = fullPath.split('/').slice(0, -1).join('/')
            resolvedPath = `${dir}/${importPath}`.replace(/\/\.\//g, '/')
          } else {
            // Resolve path alias
            const aliasResolved = resolvePathAlias(importPath)
            if (aliasResolved) {
              resolvedPath = aliasResolved
            } else {
              continue
            }
          }

          // Normalize path
          resolvedPath = resolvedPath.split('/').reduce((acc: string[], part) => {
            if (part === '..') acc.pop()
            else if (part !== '.') acc.push(part)
            return acc
          }, []).join('/')

          await loadSourceFile(resolvedPath, depth + 1)
        }

        return
      }
    } catch {
      // File doesn't exist, try next extension
    }
  }
}

// Load project source files for path alias resolution
async function loadProjectSources(): Promise<void> {
  if (typeof window.gitton === 'undefined') return

  console.log('[Monaco] Loading project sources for path aliases...')

  // Load common entry points
  const entryPoints = ['src/index.ts', 'src/index.tsx', 'src/main.ts', 'src/main.tsx', 'src/App.tsx']

  for (const entry of entryPoints) {
    await loadSourceFile(entry)
  }

  // Load all .d.ts files in src
  await loadDtsFromDir('src', 5)

  console.log('[Monaco] Finished loading project sources')
}

// Initialize type system
async function initTypeSystem(): Promise<void> {
  await loadTsConfig()
  await loadAllNodeModulesTypes()
  await loadProjectSources()
  console.log(`[Monaco] Type system initialized. Loaded ${loadedFiles.size} files`)
}

// Initialize editor
function initEditor(container: HTMLElement) {
  editor = monaco.editor.create(container, {
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    tabSize: 2,
    wordWrap: 'off',
    formatOnPaste: true,
    formatOnType: true,
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    padding: {
      top: 8,
      bottom: 8
    }
  })

  // Listen for content changes
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const content = editor.getValue()
      window.parent.postMessage({
        type: 'contentChanged',
        content,
        filename: currentFilename
      }, '*')
    }
  })

  return editor
}

// Set editor content
function setContent(content: string, filename: string) {
  if (!editor) return

  currentFilename = filename
  const language = detectLanguage(filename)

  // Create a proper URI for the model
  const uri = monaco.Uri.parse(`file:///${filename}`)

  // Dispose existing model if any
  const existingModel = monaco.editor.getModel(uri)
  if (existingModel) {
    existingModel.dispose()
  }

  // Create new model with proper URI
  const model = monaco.editor.createModel(content, language, uri)
  editor.setModel(model)

  // Load the current file and its imports into the type system
  if (language === 'typescript' || language === 'javascript') {
    loadSourceFile(filename).catch(e => console.warn('[Monaco] Failed to load file types:', e))
  }
}

// Get editor content
function getContent(): string {
  return editor?.getValue() || ''
}

// Listen for messages from parent
window.addEventListener('message', (event) => {
  const { type, content, filename, theme, options } = event.data || {}

  switch (type) {
    case 'render':
    case 'setContent':
      setContent(content || '', filename || options?.filename || '')
      break

    case 'getContent':
      window.parent.postMessage({
        type: 'content',
        content: getContent(),
        filename: currentFilename
      }, '*')
      break

    case 'theme':
      applyTheme(theme)
      break

    case 'focus':
      editor?.focus()
      break

    case 'setReadOnly':
      editor?.updateOptions({ readOnly: !!options?.readOnly })
      break
  }
})

// Listen for Gitton context changes
window.addEventListener('gitton:contextchange', (event) => {
  const detail = (event as CustomEvent).detail
  if (detail?.theme) {
    applyTheme(detail.theme)
  }
})

// Apply initial theme from Gitton context
if (typeof window.gitton !== 'undefined' && window.gitton?.context?.theme) {
  applyTheme(window.gitton.context.theme)
}

// Initialize
const container = document.getElementById('editor')!
initEditor(container)

// Initialize type system after editor is ready
initTypeSystem().then(() => {
  console.log('[Monaco] Type system ready')
}).catch(e => {
  console.warn('[Monaco] Type system init failed:', e)
})

// Signal ready
window.parent.postMessage({ type: 'ready' }, '*')
