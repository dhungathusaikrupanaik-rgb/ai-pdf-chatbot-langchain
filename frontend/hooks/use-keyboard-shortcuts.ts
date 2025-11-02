import { useCallback, useEffect } from 'react'

interface Shortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description?: string
}

interface UseKeyboardShortcutsOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    preventDefault = true,
    stopPropagation = true,
    enabled = true
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        event.key === shortcut.key &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey
      )
    })

    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault()
      }
      if (stopPropagation) {
        event.stopPropagation()
      }
      matchingShortcut.action()
    }
  }, [shortcuts, enabled, preventDefault, stopPropagation])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const getShortcutsHelp = useCallback(() => {
    return shortcuts.map(shortcut => {
      const keys = []
      if (shortcut.ctrlKey) keys.push('Ctrl')
      if (shortcut.metaKey) keys.push('Cmd')
      if (shortcut.shiftKey) keys.push('Shift')
      if (shortcut.altKey) keys.push('Alt')
      keys.push(shortcut.key)

      return {
        keys: keys.join(' + '),
        description: shortcut.description || ''
      }
    })
  }, [shortcuts])

  return {
    getShortcutsHelp
  }
}

// Common shortcuts preset
export const commonShortcuts = {
  send: (action: () => void) => ({
    key: 'Enter',
    action,
    description: 'Send message'
  }),
  newline: (action: () => void) => ({
    key: 'Enter',
    shiftKey: true,
    action,
    description: 'New line'
  }),
  focus: (action: () => void) => ({
    key: '/',
    action,
    description: 'Focus input'
  }),
  clear: (action: () => void) => ({
    key: 'Escape',
    action,
    description: 'Clear input'
  }),
  upload: (action: () => void) => ({
    key: 'u',
    ctrlKey: true,
    action,
    description: 'Upload file'
  })
}