import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/langgraph-server';
import { retrievalAssistantStreamConfig } from '@/constants/graphConfigs';

export const runtime = 'edge';

// Enhanced error types
class ValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ChatError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ChatError';
  }
}

// Utility functions
function validateMessage(message: any): { valid: boolean; error?: string } {
  if (!message) {
    return { valid: false, error: 'Message is required' };
  }

  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmedMessage.length > 10000) {
    return { valid: false, error: 'Message is too long. Maximum 10,000 characters allowed.' };
  }

  return { valid: true };
}

function validateThreadId(threadId: any): { valid: boolean; error?: string } {
  if (!threadId) {
    return { valid: false, error: 'Thread ID is required' };
  }

  if (typeof threadId !== 'string') {
    return { valid: false, error: 'Thread ID must be a string' };
  }

  if (threadId.length < 1 || threadId.length > 100) {
    return { valid: false, error: 'Invalid Thread ID format' };
  }

  return { valid: true };
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    let body: { message: string; threadId: string };
    try {
      body = await req.json();
    } catch (error) {
      throw new ValidationError('Invalid request format. Please ensure you are sending valid JSON.');
    }

    const { message, threadId } = body;

    // Validate inputs
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      throw new ValidationError(messageValidation.error!);
    }

    const threadIdValidation = validateThreadId(threadId);
    if (!threadIdValidation.valid) {
      throw new ValidationError(threadIdValidation.error!);
    }

    // Check environment configuration
    if (!process.env.LANGGRAPH_RETRIEVAL_ASSISTANT_ID) {
      throw new ChatError(
        'Service configuration error: Chat service is not properly configured',
        503
      );
    }

    // Initialize server client
    let serverClient;
    try {
      serverClient = createServerClient();
    } catch (error) {
      throw new ChatError(
        'Failed to initialize chat service. Please try again later.',
        503
      );
    }

    const assistantId = process.env.LANGGRAPH_RETRIEVAL_ASSISTANT_ID;
    let stream;

    // Initialize chat stream with error handling
    try {
      stream = await serverClient.client.runs.stream(
        threadId,
        assistantId,
        {
          input: { query: message.trim() },
          streamMode: ['messages', 'updates'],
          config: {
            configurable: {
              ...retrievalAssistantStreamConfig,
            },
          },
          metadata: {
            startTime,
            userAgent: req.headers.get('user-agent') || 'unknown',
          }
        },
      );
    } catch (error) {
      console.error('Stream initialization failed:', error);

      // Handle specific LangGraph errors
      if (error instanceof Error) {
        if (error.message.includes('thread not found')) {
          throw new ChatError(
            'Chat session not found. Please start a new conversation.',
            404
          );
        }
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new ChatError(
            'Service temporarily unavailable due to high demand. Please try again in a few minutes.',
            429
          );
        }
      }

      throw new ChatError(
        'Unable to start chat session. Please try again.',
        503
      );
    }

    // Set up response stream with enhanced error handling
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        let messageCount = 0;
        const maxMessages = 1000; // Prevent infinite streams

        try {
          // Send initial connection message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'connection',
              message: 'Connected to chat service',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          // Forward each chunk from the graph to the client
          for await (const chunk of stream) {
            messageCount++;

            // Prevent infinite streams
            if (messageCount > maxMessages) {
              console.warn(`Stream exceeded maximum messages (${maxMessages}), terminating`);
              break;
            }

            try {
              // Validate chunk before sending
              if (chunk && typeof chunk === 'object') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
              } else {
                console.warn('Received invalid chunk format:', chunk);
              }
            } catch (chunkError) {
              console.error('Error processing chunk:', chunkError);
              // Continue processing other chunks
            }
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'completion',
              message: 'Chat response completed',
              timestamp: new Date().toISOString(),
              totalMessages: messageCount
            })}\n\n`)
          );

        } catch (error) {
          console.error('Streaming error:', error);

          // Send error message to client
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: 'Connection interrupted',
              details: process.env.NODE_ENV === 'development' ? errorMessage : 'Please try again',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },

      // Handle cancellation
      cancel() {
        console.log('Chat stream cancelled by client');
      }
    });

    // Return the stream with enhanced headers
    return new Response(customReadable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Chat request failed after ${processingTime}ms:`, error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'validation_error',
        processingTimeMs: processingTime
      }, {
        status: error.statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    if (error instanceof ChatError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'chat_error',
        processingTimeMs: processingTime
      }, {
        status: error.statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Please try again later.',
      type: 'server_error',
      processingTimeMs: processingTime
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
