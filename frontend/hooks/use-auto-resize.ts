import { useCallback, useEffect, useRef } from 'react'

interface UseAutoResizeOptions {
  maxHeight?: number
  minHeight?: number
  padding?: number
}

export function useAutoResize(options: UseAutoResizeOptions = {}) {
  const {
    maxHeight = 200,
    minHeight = 44,
    padding = 16
  } = options

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the scrollHeight
    textarea.style.height = 'auto'

    // Calculate new height
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, textarea.scrollHeight + padding)
    )

    textarea.style.height = `${newHeight}px`

    // Enable scrollbar if content exceeds maxHeight
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxHeight, minHeight, padding])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Initial resize
    resize()

    // Add event listeners
    const handleInput = () => resize()
    const handleFocus = () => resize()

    textarea.addEventListener('input', handleInput)
    textarea.addEventListener('focus', handleFocus)

    // Handle window resize
    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)

    return () => {
      textarea.removeEventListener('input', handleInput)
      textarea.removeEventListener('focus', handleFocus)
      window.removeEventListener('resize', handleResize)
    }
  }, [resize])

  return {
    textareaRef,
    resize
  }
}