import { useCallback, useEffect } from 'react'

// Utility function to announce messages to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove the announcement after it's been read
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Hook for managing focus trap in modals
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          event.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          event.preventDefault()
        }
      }
    }

    if (event.key === 'Escape') {
      const escapeEvent = new CustomEvent('escape-pressed', { detail: container })
      document.dispatchEvent(escapeEvent)
    }
  }, [isActive, containerRef])

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', trapFocus)
      // Focus the first focusable element when trap is activated
      const firstFocusable = containerRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }

    return () => {
      document.removeEventListener('keydown', trapFocus)
    }
  }, [isActive, trapFocus])
}

// Hook for managing keyboard navigation
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  options: {
    orientation?: 'vertical' | 'horizontal'
    loop?: boolean
    onSelect?: (id: string) => void
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const navigate = useCallback((direction: 'next' | 'previous') => {
    if (items.length === 0) return

    let newIndex = focusedIndex
    if (direction === 'next') {
      newIndex = focusedIndex + 1
      if (newIndex >= items.length) {
        newIndex = loop ? 0 : items.length - 1
      }
    } else {
      newIndex = focusedIndex - 1
      if (newIndex < 0) {
        newIndex = loop ? items.length - 1 : 0
      }
    }

    setFocusedIndex(newIndex)
    items[newIndex]?.element?.focus()
  }, [focusedIndex, items, loop])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isVertical = orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    switch (event.key) {
      case nextKey:
        event.preventDefault()
        navigate('next')
        break
      case prevKey:
        event.preventDefault()
        navigate('previous')
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        items[0]?.element?.focus()
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(items.length - 1)
        items[items.length - 1]?.element?.focus()
        break
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && items[focusedIndex]) {
          event.preventDefault()
          onSelect?.(items[focusedIndex].id)
        }
        break
    }
  }, [orientation, navigate, focusedIndex, items, onSelect])

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  }
}

// Hook for detecting user preferences
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    prefersDark: false,
    prefersReducedData: false
  })

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches
      })
    }

    updatePreferences()

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-data: reduce)')
    ]

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences))

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences))
    }
  }, [])

  return preferences
}

// Utility for generating unique IDs
let idCounter = 0
export function generateId(prefix = 'id') {
  return `${prefix}-${++idCounter}`
}

// Utility for managing ARIA attributes
export function getAriaAttributes(options: {
  label?: string
  labelledby?: string
  describedby?: string
  required?: boolean
  invalid?: boolean
  expanded?: boolean
  hidden?: boolean
}) {
  const attrs: Record<string, string | boolean> = {}

  if (options.label) attrs['aria-label'] = options.label
  if (options.labelledby) attrs['aria-labelledby'] = options.labelledby
  if (options.describedby) attrs['aria-describedby'] = options.describedby
  if (options.required !== undefined) attrs['aria-required'] = options.required
  if (options.invalid !== undefined) attrs['aria-invalid'] = options.invalid
  if (options.expanded !== undefined) attrs['aria-expanded'] = options.expanded
  if (options.hidden !== undefined) attrs['aria-hidden'] = options.hidden

  return attrs
}