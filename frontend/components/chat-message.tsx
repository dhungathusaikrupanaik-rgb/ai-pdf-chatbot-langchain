import { Copy, ThumbsUp, ThumbsDown, User, Bot, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { PDFDocument } from '@/types/graphTypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TypingIndicator } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    sources?: PDFDocument[];
    timestamp?: Date;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showActions, setShowActions] = useState(false);
  const isLoading = message.role === 'assistant' && message.content === '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    // Here you would normally send this feedback to your analytics/service
  };

  const showSources =
    message.role === 'assistant' &&
    message.sources &&
    message.sources.length > 0;

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-slide-up`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className="space-y-1">
          {/* Message Header */}
          {!isUser && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm font-medium">Assistant</span>
              {message.timestamp && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`
              relative rounded-2xl px-4 py-3
              ${isUser
                ? 'message-user text-primary-foreground'
                : 'message-assistant text-foreground'
              }
              ${showActions ? 'shadow-lg' : 'shadow-md'}
              transition-all duration-200
            `}
          >
            {isLoading ? (
              <div className="py-2">
                <TypingIndicator />
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap break-words text-fluid-sm leading-relaxed">
                  {message.content}
                </div>

                {/* Message Actions */}
                <AnimatePresence>
                  {(!isUser && (showActions || copied || feedback)) && (
                    <motion.div
                      className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs hover:bg-background/20"
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                      >
                        <Copy className={`w-3 h-3 mr-1 ${copied ? 'text-green-500' : ''}`} />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>

                      <div className="w-px h-4 bg-border/30 mx-1" />

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs hover:bg-background/20 ${
                          feedback === 'up' ? 'text-green-600' : ''
                        }`}
                        onClick={() => handleFeedback('up')}
                        title="Good response"
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Helpful
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs hover:bg-background/20 ${
                          feedback === 'down' ? 'text-red-600' : ''
                        }`}
                        onClick={() => handleFeedback('down')}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        Not Helpful
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Sources Section */}
          {showSources && message.sources && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Accordion type="single" collapsible className="w-full mt-2">
                <AccordionItem value="sources" className="border-b-0 bg-card/50 rounded-lg overflow-hidden">
                  <AccordionTrigger className="text-sm py-3 px-4 justify-start gap-2 hover:no-underline hover:bg-card/80 transition-colors">
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    <span>View Sources ({message.sources.length})</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {message.sources?.map((source, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Card className="bg-background/80 border-border/50 hover:border-border hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-primary/60 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                    {source.metadata?.source ||
                                      source.metadata?.filename ||
                                      'Unknown Source'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                      Page {source.metadata?.loc?.pageNumber || 'N/A'}
                                    </p>
                                    {source.metadata?.pageCount && (
                                      <span className="text-xs text-muted-foreground/70">
                                        • {source.metadata.pageCount} pages
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
