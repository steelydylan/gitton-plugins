import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Globe, Plus, Trash2, GripVertical } from 'lucide-react'
import './index.css'

interface UrlEntry {
  name: string
  url: string
}

function App() {
  const [urls, setUrls] = useState<UrlEntry[]>([
    { name: 'Dev Server', url: 'http://localhost:3000' }
  ])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('http://localhost:')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load saved URLs from settings
    const loadUrls = async () => {
      if (typeof window.gitton !== 'undefined') {
        try {
          const savedUrls = await window.gitton.settings.get('urls') as UrlEntry[] | undefined
          if (savedUrls && Array.isArray(savedUrls)) {
            setUrls(savedUrls)
          }
        } catch (e) {
          console.error('Failed to load URLs:', e)
        }
      }
    }
    loadUrls()

    // Apply initial theme
    if (typeof window.gitton !== 'undefined' && window.gitton?.context?.theme) {
      applyTheme(window.gitton.context.theme)
    }

    // Listen for theme changes
    const handleContextChange = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.theme) {
        applyTheme(detail.theme)
      }
    }
    window.addEventListener('gitton:contextchange', handleContextChange)

    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'gitton:context' && event.data.context?.theme) {
        applyTheme(event.data.context.theme)
      }
    }
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('gitton:contextchange', handleContextChange)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme === 'dark' ? 'dark' : 'light')
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const addUrl = () => {
    if (!newName.trim() || !newUrl.trim()) return

    setUrls([...urls, { name: newName.trim(), url: newUrl.trim() }])
    setNewName('')
    setNewUrl('http://localhost:')
    setHasChanges(true)
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const updateUrl = (index: number, field: 'name' | 'url', value: string) => {
    const newUrls = [...urls]
    newUrls[index] = { ...newUrls[index], [field]: value }
    setUrls(newUrls)
    setHasChanges(true)
  }

  const saveSettings = async () => {
    if (typeof window.gitton !== 'undefined') {
      try {
        await window.gitton.settings.set('urls', urls)
        setHasChanges(false)
        window.gitton.ui.showNotification('Settings saved', 'info')
      } catch (e) {
        console.error('Failed to save URLs:', e)
        window.gitton.ui.showNotification('Failed to save settings', 'error')
      }
    }
  }

  const isDark = theme === 'dark'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Globe className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <div>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Browser Preview
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Configure URLs to open in your browser
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Saved URLs
          </h2>
          <div className={`border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {urls.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 ${
                  index !== urls.length - 1
                    ? isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'
                    : ''
                }`}
              >
                <GripVertical className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateUrl(index, 'name', e.target.value)}
                  placeholder="Name"
                  className={`flex-1 px-2 py-1 rounded border text-sm ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <input
                  type="text"
                  value={entry.url}
                  onChange={(e) => updateUrl(index, 'url', e.target.value)}
                  placeholder="http://localhost:3000"
                  className={`flex-[2] px-2 py-1 rounded border text-sm font-mono ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => removeUrl(index)}
                  className={`p-1 rounded ${
                    isDark
                      ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                      : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                  }`}
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {urls.length === 0 && (
              <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No URLs configured yet.
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Add New URL
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g., Frontend)"
              className={`flex-1 px-3 py-2 rounded border text-sm ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className={`flex-[2] px-3 py-2 rounded border text-sm font-mono ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addUrl()
              }}
            />
            <button
              onClick={addUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
