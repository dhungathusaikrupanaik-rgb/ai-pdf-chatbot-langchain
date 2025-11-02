import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceInputOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxDuration?: number
}

interface VoiceInputState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  isRecording: boolean
  error: string | null
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxDuration = 30000 // 30 seconds
  } = options

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    isRecording: false,
    error: null
  })

  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition ||
                                (window as any).webkitSpeechRecognition

      setState(prev => ({
        ...prev,
        isSupported: !!SpeechRecognition
      }))

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = continuous
        recognitionRef.current.interimResults = interimResults
        recognitionRef.current.lang = language

        recognitionRef.current.onstart = () => {
          setState(prev => ({
            ...prev,
            isListening: true,
            isRecording: true,
            error: null
          }))

          // Set timeout to stop recording after maxDuration
          if (maxDuration > 0) {
            timeoutRef.current = setTimeout(() => {
              stopListening()
            }, maxDuration)
          }
        }

        recognitionRef.current.onend = () => {
          setState(prev => ({
            ...prev,
            isListening: false,
            isRecording: false
          }))

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          setState(prev => ({
            ...prev,
            transcript: finalTranscript || interimTranscript
          }))
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setState(prev => ({
            ...prev,
            error: getErrorMessage(event.error),
            isListening: false,
            isRecording: false
          }))

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [language, continuous, interimResults, maxDuration])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser'
      }))
      return
    }

    if (recognitionRef.current && !state.isListening) {
      setState(prev => ({ ...prev, transcript: '', error: null }))
      recognitionRef.current.start()
    }
  }, [state.isSupported, state.isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop()
    }
  }, [state.isListening])

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }))
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript,
    toggleListening: state.isListening ? stopListening : startListening
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.'
    case 'audio-capture':
      return 'Microphone access denied. Please allow microphone access.'
    case 'not-allowed':
      return 'Microphone permission denied. Please allow microphone access in your browser settings.'
    case 'network':
      return 'Network error. Please check your internet connection.'
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.'
    default:
      return 'Speech recognition error. Please try again.'
  }
}