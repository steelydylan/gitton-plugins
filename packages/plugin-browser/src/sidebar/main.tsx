import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Globe,
  Plus,
  X,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Home,
  Zap,
  ExternalLink
} from 'lucide-react'
import './index.css'

interface Tab {
  id: string
  url: string
  title: string
  isLoading: boolean
}

interface ListeningPort {
  port: number
  pid: number
  command: string
}

// Helper to call Gitton API
async function callGittonAPI<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = Date.now() + Math.random()

    const handleResponse = (event: MessageEvent) => {
      if (event.data.type === 'gitton:response' && event.data.requestId === requestId) {
        window.removeEventListener('message', handleResponse)
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result as T)
        }
      }
    }

    window.addEventListener('message', handleResponse)

    window.parent.postMessage({
      type: 'gitton:request',
      pluginId: window.gitton?.pluginId,
      requestId,
      method,
      params
    }, '*')

    setTimeout(() => {
      window.removeEventListener('message', handleResponse)
      reject(new Error('Request timeout'))
    }, 10000)
  })
}

function generateId() {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [urlInput, setUrlInput] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [detectedPorts, setDetectedPorts] = useState<ListeningPort[]>([])
  const [showPortsDropdown, setShowPortsDropdown] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map())

  const activeTab = tabs.find(t => t.id === activeTabId)

  // Detect listening ports
  const detectPorts = useCallback(async () => {
    try {
      const ports = await callGittonAPI<ListeningPort[]>('terminal.getListeningPorts')
      return ports || []
    } catch (e) {
      console.error('Failed to detect ports:', e)
      return []
    }
  }, [])

  // Initialize with detected port or default
  useEffect(() => {
    if (initialized) return

    const init = async () => {
      const ports = await detectPorts()
      setDetectedPorts(ports)

      // Use first detected port or fallback to localhost:3000
      const defaultUrl = ports.length > 0
        ? `http://localhost:${ports[0].port}`
        : 'http://localhost:3000'

      const initialTab = {
        id: generateId(),
        url: defaultUrl,
        title: 'New Tab',
        isLoading: true
      }
      setTabs([initialTab])
      setActiveTabId(initialTab.id)
      setUrlInput(defaultUrl)
      setInitialized(true)
    }

    init()
  }, [initialized, detectPorts])

  // Periodic port detection
  useEffect(() => {
    if (!initialized) return

    const interval = setInterval(async () => {
      const ports = await detectPorts()
      setDetectedPorts(ports)
    }, 5000)
    return () => clearInterval(interval)
  }, [initialized, detectPorts])

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url)
    }
  }, [activeTabId, activeTab?.url])

  useEffect(() => {
    if (typeof window.gitton !== 'undefined' && window.gitton?.context?.theme) {
      applyTheme(window.gitton.context.theme)
    }

    const handleContextChange = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.theme) {
        applyTheme(detail.theme)
      }
    }
    window.addEventListener('gitton:contextchange', handleContextChange)

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

  const navigateTo = (url: string) => {
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'http://' + finalUrl
    }

    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, url: finalUrl, isLoading: true }
        : tab
    ))
    setUrlInput(finalUrl)
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigateTo(urlInput)
  }

  const addTab = (url = 'http://localhost:3000') => {
    const newTab: Tab = {
      id: generateId(),
      url,
      title: 'New Tab',
      isLoading: true
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setUrlInput(url)
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      // Don't close last tab, just reset it
      setTabs([{ id: generateId(), url: 'http://localhost:3000', title: 'New Tab', isLoading: false }])
      return
    }

    const tabIndex = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      setActiveTabId(newTabs[newActiveIndex].id)
    }
  }

  const refresh = () => {
    const iframe = iframeRefs.current.get(activeTabId)
    if (iframe) {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, isLoading: true } : tab
      ))
      iframe.src = iframe.src
    }
  }

  const handleIframeLoad = (tabId: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, isLoading: false } : tab
    ))

    // Try to get title from iframe (may fail due to CORS)
    try {
      const iframe = iframeRefs.current.get(tabId)
      if (iframe?.contentDocument?.title) {
        setTabs(prev => prev.map(tab =>
          tab.id === tabId ? { ...tab, title: iframe.contentDocument!.title } : tab
        ))
      }
    } catch {
      // CORS prevents access, use URL as title
      const tab = tabs.find(t => t.id === tabId)
      if (tab) {
        try {
          const url = new URL(tab.url)
          setTabs(prev => prev.map(t =>
            t.id === tabId ? { ...t, title: url.host } : t
          ))
        } catch {
          // Invalid URL
        }
      }
    }
  }

  const openInExternal = async () => {
    if (activeTab && typeof window.gitton !== 'undefined') {
      try {
        await window.gitton.ui.openExternal(activeTab.url)
      } catch (e) {
        console.error('Failed to open external:', e)
      }
    }
  }

  const isDark = theme === 'dark'

  // Show loading state while initializing
  if (!initialized || tabs.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Detecting ports...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Tab Bar */}
      <div className={`flex items-center gap-1 px-2 pt-2 pb-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium max-w-[180px] min-w-[100px] transition-colors ${
                tab.id === activeTabId
                  ? isDark
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-900'
                  : isDark
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {tab.isLoading ? (
                <RotateCw className="w-3 h-3 animate-spin shrink-0" />
              ) : (
                <Globe className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate flex-1">{tab.title}</span>
              <X
                className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500`}
                onClick={(e) => closeTab(tab.id, e)}
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => addTab()}
          className={`p-1 rounded hover:bg-opacity-20 ${
            isDark ? 'text-gray-400 hover:bg-white' : 'text-gray-500 hover:bg-black'
          }`}
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* URL Bar */}
      <div className={`flex items-center gap-2 px-2 py-1.5 border-b ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={refresh}
          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          title="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin' : ''}`} />
        </button>

        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className={`flex-1 flex items-center rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
          }`}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL..."
              className={`flex-1 px-3 py-1.5 text-sm bg-transparent outline-none ${
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
            {detectedPorts.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPortsDropdown(!showPortsDropdown)}
                  className={`px-2 py-1 mr-1 rounded flex items-center gap-1 text-xs ${
                    isDark
                      ? 'bg-green-900/50 text-green-400 hover:bg-green-900'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {detectedPorts.length}
                </button>
                {showPortsDropdown && (
                  <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[200px] ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    {detectedPorts.map(port => (
                      <button
                        key={port.port}
                        type="button"
                        onClick={() => {
                          navigateTo(`http://localhost:${port.port}`)
                          setShowPortsDropdown(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                          isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-mono">:{port.port}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {port.command}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <button
          onClick={openInExternal}
          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          title="Open in External Browser"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative">
        {tabs.map(tab => (
          <iframe
            key={tab.id}
            ref={(el) => {
              if (el) {
                iframeRefs.current.set(tab.id, el)
              } else {
                iframeRefs.current.delete(tab.id)
              }
            }}
            src={tab.url}
            className={`absolute inset-0 w-full h-full border-0 ${
              tab.id === activeTabId ? 'block' : 'hidden'
            }`}
            onLoad={() => handleIframeLoad(tab.id)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ))}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
