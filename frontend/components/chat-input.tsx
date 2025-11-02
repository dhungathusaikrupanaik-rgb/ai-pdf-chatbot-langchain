import { useState, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Paperclip,
  ArrowUp,
  Mic,
  MicOff,
  StopCircle,
  Command,
  Keyboard
} from 'lucide-react';
import { useAutoResize } from '@/hooks/use-auto-resize';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  onFileUpload: () => void;
  placeholder?: string;
  disabled?: boolean;
  isUploading?: boolean;
  isLoading?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
  ({
    onSubmit,
    onFileUpload,
    placeholder = "Send a message...",
    disabled = false,
    isUploading = false,
    isLoading = false,
    value,
    onChange
  }, ref) => {
    const [internalValue, setInternalValue] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const messageValue = value !== undefined ? value : internalValue;
    const setMessageValue = onChange || setInternalValue;

    const { textareaRef, resize } = useAutoResize({
      maxHeight: 200,
      minHeight: 44,
      padding: 16
    });

    const {
      isListening,
      isSupported: voiceSupported,
      transcript,
      error: voiceError,
      startListening,
      stopListening,
      clearTranscript
    } = useVoiceInput({
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxDuration: 30000
    });

    // Handle voice transcript
    if (transcript && !messageValue.includes(transcript)) {
      setMessageValue(messageValue ? `${messageValue} ${transcript}` : transcript);
    }

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!messageValue.trim() || disabled || isLoading) return;

      onSubmit(messageValue.trim());
      setMessageValue('');
      clearTranscript();
      resize();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleVoiceToggle = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    // Keyboard shortcuts
    const shortcuts = [
      {
        key: 'Enter',
        action: () => handleSubmit(),
        description: 'Send message'
      },
      {
        key: 'Enter',
        shiftKey: true,
        action: () => {
          // Allow new line
        },
        description: 'New line'
      },
      {
        key: 'Escape',
        action: () => setMessageValue(''),
        description: 'Clear input'
      },
      {
        key: 'u',
        ctrlKey: true,
        action: onFileUpload,
        description: 'Upload file'
      },
      {
        key: 'v',
        ctrlKey: true,
        shiftKey: true,
        action: handleVoiceToggle,
        description: 'Voice input'
      }
    ];

    useKeyboardShortcuts(shortcuts, {
      preventDefault: true,
      stopPropagation: true,
      enabled: !disabled && !isLoading
    });

    const getShortcutsHelp = () => shortcuts.map(s => {
      const keys = [];
      if (s.ctrlKey) keys.push('Ctrl');
      if (s.shiftKey) keys.push('Shift');
      keys.push(s.key);
      return { keys: keys.join(' + '), description: s.description };
    });

    return (
      <div ref={ref} className="relative">
        {/* Voice Error Display */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 left-0 right-0 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <p className="text-sm text-destructive">{voiceError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Help */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 left-0 right-0 p-4 bg-card border rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <Keyboard className="w-4 h-4" />
                <span className="font-medium text-sm">Keyboard Shortcuts</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {getShortcutsHelp().map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 p-4 bg-card/50 backdrop-blur-sm border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
            {/* File Upload Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 touch-target hover:bg-primary/10 transition-colors"
              onClick={onFileUpload}
              disabled={disabled || isUploading}
              title="Upload file (Ctrl+U)"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>

            {/* Input Area */}
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={
                  isListening ? 'Listening...' :
                  isUploading ? 'Uploading files...' :
                  isLoading ? 'Processing...' :
                  placeholder
                }
                disabled={disabled || isLoading}
                className={cn(
                  'w-full px-4 py-3 bg-transparent border-0 rounded-xl resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-fluid-sm leading-relaxed min-h-[44px] max-h-[200px]',
                  isListening && 'text-primary',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) hsl(var(--muted))'
                }}
              />

              {/* Character Count */}
              {messageValue.length > 500 && (
                <div className="absolute bottom-1 right-1 text-xs text-muted-foreground/60">
                  {messageValue.length}
                </div>
              )}
            </div>

            {/* Voice Input Button */}
            {voiceSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'flex-shrink-0 touch-target transition-all duration-200',
                  isListening
                    ? 'text-destructive bg-destructive/10 hover:bg-destructive/20 animate-pulse'
                    : 'hover:bg-primary/10'
                )}
                onClick={handleVoiceToggle}
                disabled={disabled || isLoading}
                title={
                  isListening
                    ? 'Stop recording (Ctrl+Shift+V)'
                    : 'Start voice input (Ctrl+Shift+V)'
                }
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Keyboard Shortcuts Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 touch-target hover:bg-primary/10 transition-colors sm:hidden"
              onClick={() => setShowShortcuts(!showShortcuts)}
              title="Keyboard shortcuts"
            >
              <Command className="w-4 h-4" />
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              className={cn(
                'flex-shrink-0 touch-target transition-all duration-200',
                messageValue.trim() && !disabled && !isLoading
                  ? 'bg-primary hover:bg-primary/90 scale-105'
                  : 'bg-muted hover:bg-muted/80'
              )}
              disabled={
                !messageValue.trim() ||
                disabled ||
                isLoading ||
                isListening
              }
              title="Send message (Enter)"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isListening ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Voice Recording Indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-2 -right-2"
              >
                <div className="relative">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-destructive rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Voice Instructions */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mt-2 text-center text-sm text-muted-foreground animate-pulse"
            >
              🎤 Listening... Speak clearly into your microphone
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';