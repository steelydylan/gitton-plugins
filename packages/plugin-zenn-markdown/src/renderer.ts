/**
 * Zenn Markdown Renderer for Gitton Plugin
 *
 * This module exports a `render` function that converts Zenn-style markdown
 * to HTML. It gets loaded dynamically by Gitton and executed in the browser.
 */
import markdownToHtml from 'zenn-markdown-html'

interface Frontmatter {
  title?: string
  emoji?: string
  type?: 'tech' | 'idea'
  topics?: string[]
  published?: boolean
  publication_name?: string
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: null, body: content }
  }

  const yamlContent = match[1]
  const body = match[2]

  // Simple YAML parser for frontmatter
  const frontmatter: Frontmatter = {}
  const lines = yamlContent.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    switch (key) {
      case 'title':
        frontmatter.title = value
        break
      case 'emoji':
        frontmatter.emoji = value
        break
      case 'type':
        frontmatter.type = value as 'tech' | 'idea'
        break
      case 'published':
        frontmatter.published = value === 'true'
        break
      case 'publication_name':
        frontmatter.publication_name = value
        break
      case 'topics':
        // Parse array: [topic1, topic2] or - topic1 format
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter.topics = value
            .slice(1, -1)
            .split(',')
            .map(t => t.trim().replace(/['"]/g, ''))
            .filter(Boolean)
        }
        break
    }
  }

  // Handle multi-line topics array
  if (!frontmatter.topics) {
    const topicsMatch = yamlContent.match(/topics:\s*\n((?:\s+-\s+.+\n?)+)/)
    if (topicsMatch) {
      frontmatter.topics = topicsMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
    }
  }

  return { frontmatter, body }
}

/**
 * Render frontmatter as Zenn-style header
 */
function renderFrontmatterHeader(frontmatter: Frontmatter): string {
  const typeLabel = frontmatter.type === 'tech' ? 'Tech' : frontmatter.type === 'idea' ? 'Idea' : ''
  const typeColor = frontmatter.type === 'tech' ? '#3b82f6' : '#8b5cf6'

  const topicsHtml = frontmatter.topics?.length
    ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;">
        ${frontmatter.topics.map(topic => `
          <span style="
            display: inline-block;
            padding: 2px 10px;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          ">${topic}</span>
        `).join('')}
       </div>`
    : ''

  const statusHtml = frontmatter.published === false
    ? `<span style="
        display: inline-block;
        padding: 2px 8px;
        background: #fef3c7;
        color: #92400e;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 8px;
      ">Draft</span>`
    : ''

  return `
    <div style="
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.2);
    ">
      ${frontmatter.emoji ? `
        <div style="
          font-size: 64px;
          line-height: 1;
          margin-bottom: 16px;
          text-align: center;
        ">${frontmatter.emoji}</div>
      ` : ''}
      ${frontmatter.title ? `
        <h1 style="
          font-size: 28px;
          font-weight: 700;
          line-height: 1.4;
          margin: 0 0 12px 0;
          color: inherit;
        ">${frontmatter.title}${statusHtml}</h1>
      ` : ''}
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        ${typeLabel ? `
          <span style="
            display: inline-block;
            padding: 2px 10px;
            background: ${typeColor};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          ">${typeLabel}</span>
        ` : ''}
        ${frontmatter.publication_name ? `
          <span style="
            font-size: 13px;
            color: #6b7280;
          ">Publication: ${frontmatter.publication_name}</span>
        ` : ''}
      </div>
      ${topicsHtml}
    </div>
  `
}

/**
 * Render markdown content to HTML using Zenn markdown syntax
 *
 * Supports:
 * - Frontmatter parsing with Zenn-style header display
 * - :::message / :::message alert
 * - :::details
 * - @[youtube](videoId)
 * - @[twitter](tweetId)
 * - @[gist](gistUrl)
 * - @[codepen](url)
 * - @[card](url)
 * - Math expressions ($...$, $$...$$)
 * - Code blocks with syntax highlighting
 * - And more Zenn-specific syntax
 */
export function render(content: string, _options?: object): string {
  const { frontmatter, body } = parseFrontmatter(content)

  const headerHtml = frontmatter ? renderFrontmatterHeader(frontmatter) : ''
  const bodyHtml = markdownToHtml(body, {
    embedOrigin: 'https://embed.zenn.studio'
  })

  return headerHtml + bodyHtml
}

/**
 * Initialize link click handlers to open external URLs via Gitton API
 */
export function init(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    if (anchor && anchor.href) {
      const url = anchor.href
      // Only handle http/https URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        e.preventDefault()
        // Use Gitton plugin API to open external URL
        if (typeof window !== 'undefined' && window.gitton?.ui?.openExternal) {
          window.gitton.ui.openExternal(url)
        }
      }
    }
  })
}
