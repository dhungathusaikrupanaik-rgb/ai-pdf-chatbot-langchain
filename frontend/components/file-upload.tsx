import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'application/pdf': ['.pdf']
  },
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-blue-500" />;
  };

  const simulateUpload = useCallback(async (fileItem: FileUploadItem) => {
    // Simulate upload progress
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f =>
        f.id === fileItem.id ? { ...f, progress, status: 'uploading' } : f
      ));
    };

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(i);
    }

    // Simulate success/error
    const isSuccess = Math.random() > 0.1; // 90% success rate
    setFiles(prev => prev.map(f =>
      f.id === fileItem.id
        ? {
            ...f,
            status: isSuccess ? 'success' : 'error',
            error: isSuccess ? undefined : 'Upload failed. Please try again.',
            progress: 100
          }
        : f
    ));

    return isSuccess;
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (disabled) return;

    // Handle rejections
    fileRejections.forEach(({ file, errors }) => {
      console.error(`File ${file.name} was rejected:`, errors);
    });

    // Process accepted files
    const newFiles: FileUploadItem[] = acceptedFiles.slice(0, maxFiles - files.length).map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploads
    newFiles.forEach(fileItem => {
      simulateUpload(fileItem);
    });
  }, [disabled, files.length, maxFiles, simulateUpload]);

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryUpload = (fileItem: FileUploadItem) => {
    setFiles(prev => prev.map(f =>
      f.id === fileItem.id ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
    simulateUpload(fileItem);
  };

  const successfulUploads = files.filter(f => f.status === 'success');

  // Notify parent component of successful uploads
  if (successfulUploads.length > 0) {
    const uploadedFiles = successfulUploads.map(f => f.file);
    onFilesUploaded(uploadedFiles);
    // Remove successful files from the list
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  }

  const getDropzoneClassName = () => {
    if (disabled) return 'opacity-50 cursor-not-allowed';
    if (isDragReject) return 'border-destructive bg-destructive/5';
    if (isDragAccept || dropzoneActive) return 'border-primary bg-primary/5 scale-[1.02]';
    return 'border-muted-foreground/25 hover:border-muted-foreground/50';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        className={cn(
          'drop-zone cursor-pointer transition-all duration-200',
          getDropzoneClassName(),
          isDragActive && 'animate-pulse'
        )}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <motion.div
            animate={{
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? 5 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Upload className={cn(
              'w-12 h-12 transition-colors',
              isDragAccept ? 'text-primary' :
              isDragReject ? 'text-destructive' :
              'text-muted-foreground'
            )} />
          </motion.div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive
                ? 'Drop your files here'
                : 'Upload PDF documents'
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your files here, or click to browse
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Maximum file size: {formatFileSize(maxSize)}</p>
              <p>Supported formats: PDF</p>
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>

          <Button variant="outline" disabled={disabled}>
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-sm">Upload Queue</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <Card className={cn(
                    'transition-all duration-200',
                    fileItem.status === 'error' && 'border-destructive/50 bg-destructive/5',
                    fileItem.status === 'success' && 'border-green-500/50 bg-green-500/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* File Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {fileItem.status === 'uploading' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : fileItem.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : fileItem.status === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            getFileIcon(fileItem.file)
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {fileItem.file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(fileItem.file.size)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {fileItem.status === 'error' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => retryUpload(fileItem)}
                                  title="Retry upload"
                                >
                                  <Upload className="w-3 h-3" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-destructive"
                                onClick={() => removeFile(fileItem.id)}
                                title="Remove file"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {fileItem.status === 'uploading' && (
                            <div className="space-y-1">
                              <Progress
                                value={fileItem.progress || 0}
                                className="h-1"
                              />
                              <p className="text-xs text-muted-foreground">
                                Uploading... {fileItem.progress || 0}%
                              </p>
                            </div>
                          )}

                          {/* Error Message */}
                          {fileItem.status === 'error' && fileItem.error && (
                            <p className="text-xs text-destructive">
                              {fileItem.error}
                            </p>
                          )}

                          {/* Success Message */}
                          {fileItem.status === 'success' && (
                            <p className="text-xs text-green-600">
                              Upload completed successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground space-y-2"
        >
          <p>📄 Upload PDF documents to ask questions about their content</p>
          <p className="text-xs">
            The AI will analyze your documents and provide detailed answers based on the information they contain
          </p>
        </motion.div>
      )}
    </div>
  );
}