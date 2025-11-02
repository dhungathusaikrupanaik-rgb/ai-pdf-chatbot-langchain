import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rounded'
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          'rounded-md': variant === 'default',
          'h-4 w-full': variant === 'default',
          'h-4 w-3/4': variant === 'text',
          'rounded-full': variant === 'circular',
          'h-12 w-12': variant === 'circular',
          'rounded-lg h-20 w-full': variant === 'rounded',
        },
        className
      )}
      {...props}
    />
  )
}

interface MessageSkeletonProps {
  isUser?: boolean
  className?: string
}

function MessageSkeleton({ isUser = false, className }: MessageSkeletonProps) {
  return (
    <div className={cn(`flex ${isUser ? 'justify-end' : 'justify-start'} space-y-2`, className)}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" className="h-8 w-8" />
            <Skeleton variant="text" className="h-4 w-24" />
          </div>
        )}
        <div className={`rounded-2xl p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <div className="space-y-2">
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-5/6" />
            <Skeleton variant="text" className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface FileUploadSkeletonProps {
  count?: number
  className?: string
}

function FileUploadSkeleton({ count = 3, className }: FileUploadSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
          <Skeleton variant="circular" className="h-6 w-6" />
        </div>
      ))}
    </div>
  )
}

interface TypingIndicatorProps {
  className?: string
}

function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex space-x-1 p-3', className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}

export { Skeleton, MessageSkeleton, FileUploadSkeleton, TypingIndicator }
