'use client';

import type React from 'react';

import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/chat-message';
import { FilePreview } from '@/components/file-preview';
import { ChatInput } from '@/components/chat-input';
import { FileUpload } from '@/components/file-upload';
import { WelcomeState } from '@/components/welcome-state';
import { Sources } from '@/components/sources';
import { client } from '@/lib/langgraph-client';
import {
  PDFDocument,
  RetrieveDocumentsNodeUpdates,
} from '@/types/graphTypes';

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      sources?: PDFDocument[];
      timestamp?: Date;
    }>
  >([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRetrievedDocsRef = useRef<PDFDocument[]>([]);

  useEffect(() => {
    const initThread = async () => {
      if (threadId) return;

      try {
        const thread = await client.createThread();
        setThreadId(thread.thread_id);
      } catch (error) {
        console.error('Error creating thread:', error);
        toast({
          title: 'Connection Error',
          description:
            'Unable to connect to the chat service. Please make sure you have set the LANGGRAPH_API_URL environment variable correctly.',
          variant: 'destructive',
        });
      }
    };
    initThread();
  }, [threadId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || !threadId || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage = message.trim();
    const timestamp = new Date();

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, sources: undefined, timestamp },
      { role: 'assistant', content: '', sources: undefined, timestamp },
    ]);
    setInput('');
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    lastRetrievedDocsRef.current = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n').filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const sseString = line.slice('data: '.length);
          let sseEvent: { event: string; data: unknown };
          try {
            sseEvent = JSON.parse(sseString);
          } catch (err) {
            console.error('Error parsing SSE line:', err, line);
            continue;
          }

          const { event, data } = sseEvent;

          if (event === 'messages/partial') {
            if (Array.isArray(data)) {
              const lastObj = data[data.length - 1];
              if (lastObj?.type === 'ai') {
                const partialContent = lastObj.content ?? '';

                if (
                  typeof partialContent === 'string' &&
                  !partialContent.startsWith('{')
                ) {
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (
                      newArr.length > 0 &&
                      newArr[newArr.length - 1].role === 'assistant'
                    ) {
                      newArr[newArr.length - 1].content = partialContent;
                      newArr[newArr.length - 1].sources =
                        lastRetrievedDocsRef.current;
                      newArr[newArr.length - 1].timestamp = new Date();
                    }
                    return newArr;
                  });
                }
              }
            }
          } else if (event === 'updates' && data) {
            if (
              data &&
              typeof data === 'object' &&
              'retrieveDocuments' in data &&
              data.retrieveDocuments &&
              Array.isArray(data.retrieveDocuments.documents)
            ) {
              const retrievedDocs = (data as RetrieveDocumentsNodeUpdates)
                .retrieveDocuments.documents as PDFDocument[];
              lastRetrievedDocsRef.current = retrievedDocs;
            } else {
              lastRetrievedDocsRef.current = [];
            }
          } else {
            console.log('Unknown SSE event:', event, data);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Message Failed',
        description:
          'Failed to send message. Please try again.\n' +
          (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
      setMessages((prev) => {
        const newArr = [...prev];
        newArr[newArr.length - 1].content =
          'Sorry, there was an error processing your message. Please try again.';
        newArr[newArr.length - 1].timestamp = new Date();
        return newArr;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFilesUploaded = (uploadedFiles: File[]) => {
    setFiles((prev) => [...prev, ...uploadedFiles]);
    setShowFileUpload(false);
    toast({
      title: 'Upload Successful',
      description: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded and processed successfully`,
    });
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
    toast({
      title: 'File Removed',
      description: `${fileToRemove.name} has been removed`,
    });
  };

  const handlePreviewSource = (source: PDFDocument) => {
    // In a real implementation, this would open a preview modal
    console.log('Preview source:', source);
    toast({
      title: 'Source Preview',
      description: `Previewing: ${source.metadata?.source || source.metadata?.filename}`,
    });
  };

  const handleExportSources = (sources: PDFDocument[]) => {
    const citations = sources.map((source, index) =>
      `${index + 1}. ${source.metadata?.source || source.metadata?.filename || 'Unknown Source'} (Page ${source.metadata?.loc?.pageNumber || 'N/A'})`
    ).join('\n');

    navigator.clipboard.writeText(citations);
    toast({
      title: 'Sources Exported',
      description: `${sources.length} source citations copied to clipboard`,
    });
  };

  const hasMessages = messages.length > 0;
  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .pop();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Welcome State or Messages */}
        {!hasMessages ? (
          <WelcomeState
            onPromptSelect={setInput}
            onFileUpload={() => setShowFileUpload(true)}
            onStartChatting={() => {
              // Focus on input when starting to chat
              const inputElement = document.querySelector('textarea');
              inputElement?.focus();
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Messages Area */}
            <div className="space-y-4 pb-32">
              {messages.map((message, i) => (
                <ChatMessage key={i} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Sources Section */}
            {lastAssistantMessage?.sources && lastAssistantMessage.sources.length > 0 && (
              <Sources
                sources={lastAssistantMessage.sources}
                title="Sources for this response"
                showMetadata={true}
                expandable={true}
                maxVisible={3}
                onPreview={handlePreviewSource}
                onExport={handleExportSources}
              />
            )}
          </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Upload Documents</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFileUpload(false)}
                  >
                    ×
                  </Button>
                </div>
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={10}
                  maxSize={50 * 1024 * 1024} // 50MB
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* File Previews */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => handleRemoveFile(file)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t">
          <div className="container mx-auto max-w-5xl">
            <ChatInput
              onSubmit={handleSubmit}
              onFileUpload={() => setShowFileUpload(true)}
              placeholder="Ask about your documents..."
              disabled={!threadId}
              isUploading={isUploading}
              isLoading={isLoading}
              value={input}
              onChange={setInput}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
