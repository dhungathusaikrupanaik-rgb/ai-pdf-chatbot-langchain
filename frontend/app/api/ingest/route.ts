// app/api/ingest/route.ts
import { indexConfig } from '@/constants/graphConfigs';
import { getLangGraphServerClient } from '@/lib/langgraph-server';
import { processPDF } from '@/lib/pdf';
import { Document } from '@langchain/core/documents';
import { NextRequest, NextResponse } from 'next/server';

// Configuration constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;
const ALLOWED_FILE_TYPES = ['application/pdf'];

// Enhanced error types
class ValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ProcessingError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ProcessingError';
  }
}

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only PDF files are allowed.`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty.`
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check environment configuration
    if (!process.env.LANGGRAPH_INGESTION_ASSISTANT_ID) {
      throw new ValidationError(
        'Server configuration error: LANGGRAPH_INGESTION_ASSISTANT_ID is not set',
        503
      );
    }

    // Parse and validate form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      throw new ValidationError('Invalid form data. Please ensure you are uploading files correctly.');
    }

    const files: File[] = [];
    const fileNames = new Set<string>();

    // Extract files from form data
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        // Check for duplicate file names
        if (fileNames.has(value.name)) {
          throw new ValidationError(`Duplicate file detected: "${value.name}". Please rename or remove duplicate files.`);
        }
        fileNames.add(value.name);
        files.push(value);
      }
    }

    // Validate file count
    if (!files || files.length === 0) {
      throw new ValidationError('No files provided. Please select at least one PDF file to upload.');
    }

    if (files.length > MAX_FILES) {
      throw new ValidationError(`Too many files uploaded. Maximum ${MAX_FILES} files allowed per request.`);
    }

    // Validate each file
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        validationErrors.push(validation.error!);
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(`File validation failed:\n${validationErrors.join('\n')}`);
    }

    // Process PDFs with detailed error handling
    const allDocs: Document[] = [];
    const processingErrors: string[] = [];
    const processedFiles: string[] = [];

    for (const file of validFiles) {
      try {
        console.log(`Processing file: ${file.name} (${formatFileSize(file.size)})`);
        const docs = await processPDF(file);

        if (docs.length === 0) {
          processingErrors.push(`No content extracted from file: "${file.name}". The file might be corrupted or empty.`);
          continue;
        }

        allDocs.push(...docs);
        processedFiles.push(file.name);
        console.log(`Successfully processed ${file.name}: ${docs.length} pages extracted`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
        processingErrors.push(`Failed to process file "${file.name}": ${errorMessage}`);
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Check if any documents were successfully processed
    if (allDocs.length === 0) {
      const errorDetails = processingErrors.length > 0
        ? `\nDetails:\n${processingErrors.join('\n')}`
        : '';
      throw new ProcessingError(
        `No valid content could be extracted from any uploaded files.${errorDetails}`,
        422
      );
    }

    // Initialize LangGraph client
    let langGraphServerClient;
    try {
      langGraphServerClient = getLangGraphServerClient();
    } catch (error) {
      throw new ProcessingError(
        'Failed to initialize document processing service. Please try again later.',
        503
      );
    }

    // Create thread and run ingestion
    let thread;
    try {
      thread = await langGraphServerClient.createThread();
      console.log(`Created thread: ${thread.thread_id}`);
    } catch (error) {
      throw new ProcessingError(
        'Failed to create processing session. Please try again.',
        503
      );
    }

    // Run ingestion with timeout
    try {
      const ingestPromise = langGraphServerClient.client.runs.wait(
        thread.thread_id,
        'ingestion_graph',
        {
          input: {
            docs: allDocs,
          },
          config: {
            configurable: {
              ...indexConfig,
            },
          },
        }
      );

      // Add timeout for long-running operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), 300000); // 5 minutes
      });

      await Promise.race([ingestPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Processing timeout') {
        throw new ProcessingError(
          'Document processing is taking longer than expected. Please try with smaller files or contact support.',
          408
        );
      }
      throw new ProcessingError(
        'Failed to process documents. The service might be temporarily unavailable.',
        503
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(`Ingestion completed in ${processingTime}ms for ${allDocs.length} documents`);

    // Return success response with detailed information
    return NextResponse.json({
      success: true,
      message: 'Documents processed successfully',
      data: {
        threadId: thread.thread_id,
        filesProcessed: processedFiles,
        totalDocuments: allDocs.length,
        processingTimeMs: processingTime,
        warnings: processingErrors.length > 0 ? processingErrors : undefined
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Upload failed after ${processingTime}ms:`, error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'validation_error',
        processingTimeMs: processingTime
      }, { status: error.statusCode });
    }

    if (error instanceof ProcessingError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'processing_error',
        processingTimeMs: processingTime
      }, { status: error.statusCode });
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while processing your files.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Please try again later.',
      type: 'server_error',
      processingTimeMs: processingTime
    }, { status: 500 });
  }
}
