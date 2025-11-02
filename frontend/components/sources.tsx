import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Copy,
  Download,
  Eye,
  Search,
  Filter,
  BarChart3,
  Clock,
  File,
  Bookmark,
  Share2
} from 'lucide-react';
import { PDFDocument } from '@/types/graphTypes';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: PDFDocument;
  index: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPreview?: (source: PDFDocument) => void;
  showMetadata?: boolean;
}

function SourceCard({
  source,
  index,
  isExpanded = false,
  onToggle,
  onPreview,
  showMetadata = true
}: SourceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const citation = `Source ${index + 1}: ${source.metadata?.source || source.metadata?.filename || 'Unknown'} (Page ${source.metadata?.loc?.pageNumber || 'N/A'})`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  };

  const getFileName = () => {
    const sourceName = source.metadata?.source || source.metadata?.filename || 'Unknown Source';
    return sourceName.length > 50 ? sourceName.substring(0, 47) + '...' : sourceName;
  };

  const getRelevanceScore = () => {
    // Simulate relevance score - in a real app, this would come from the API
    return Math.floor(Math.random() * 30) + 70; // 70-100% relevance
  };

  const relevanceScore = getRelevanceScore();
  const pageNumbers = source.metadata?.loc?.pageNumber;
  const pageCount = source.metadata?.pageCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30',
        isExpanded && 'ring-2 ring-primary/20'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Source Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                    {getFileName()}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <File className="w-3 h-3 mr-1" />
                      Page {pageNumbers || 'N/A'}
                    </Badge>
                    {pageCount && (
                      <Badge variant="outline" className="text-xs">
                        {pageCount} pages
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">
                        {relevanceScore}% match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle */}
                {showMetadata && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle?.();
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && showMetadata && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 border-t pt-3"
                  >
                    {/* Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {source.metadata?.author && (
                        <div>
                          <span className="font-medium text-muted-foreground">Author:</span>
                          <p className="mt-1">{source.metadata.author}</p>
                        </div>
                      )}
                      {source.metadata?.publishedDate && (
                        <div>
                          <span className="font-medium text-muted-foreground">Published:</span>
                          <p className="mt-1">
                            {new Date(source.metadata.publishedDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {source.metadata?.doctype && (
                        <div>
                          <span className="font-medium text-muted-foreground">Type:</span>
                          <p className="mt-1 capitalize">{source.metadata.doctype}</p>
                        </div>
                      )}
                      {source.metadata?.language && (
                        <div>
                          <span className="font-medium text-muted-foreground">Language:</span>
                          <p className="mt-1 uppercase">{source.metadata.language}</p>
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    {source.pageContent && (
                      <div>
                        <span className="font-medium text-xs text-muted-foreground">Content Preview:</span>
                        <p className="mt-1 text-xs leading-relaxed bg-muted/50 rounded p-2 line-clamp-3">
                          {source.pageContent}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy();
                        }}
                      >
                        <Copy className={cn("w-3 h-3 mr-1", copied && "text-green-500")} />
                        {copied ? 'Copied!' : 'Copy Citation'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview?.(source);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share functionality would go here
                        }}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SourcesProps {
  sources: PDFDocument[];
  title?: string;
  showMetadata?: boolean;
  expandable?: boolean;
  maxVisible?: number;
  onPreview?: (source: PDFDocument) => void;
  onExport?: (sources: PDFDocument[]) => void;
}

export function Sources({
  sources,
  title = "Sources",
  showMetadata = true,
  expandable = true,
  maxVisible = 5,
  onPreview,
  onExport
}: SourcesProps) {
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'page'>('relevance');
  const [filterText, setFilterText] = useState('');

  const toggleSourceExpanded = (index: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    onExport?.(sources);
  };

  const filteredSources = sources.filter(source => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      (source.metadata?.source || '').toLowerCase().includes(searchText) ||
      (source.metadata?.filename || '').toLowerCase().includes(searchText) ||
      (source.pageContent || '').toLowerCase().includes(searchText)
    );
  });

  const sortedSources = [...filteredSources].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.metadata?.source || '').localeCompare(b.metadata?.source || '');
      case 'page':
        return (a.metadata?.loc?.pageNumber || 0) - (b.metadata?.loc?.pageNumber || 0);
      case 'relevance':
      default:
        // In a real implementation, you'd sort by actual relevance scores
        return 0;
    }
  });

  const visibleSources = showAll ? sortedSources : sortedSources.slice(0, maxVisible);
  const hasMore = sortedSources.length > maxVisible;

  if (sources.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {title} ({sources.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="name">Sort by Name</option>
              <option value="page">Sort by Page</option>
            </select>

            {/* Export Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleExport}
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Search/Filter */}
        {sources.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sources..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {visibleSources.map((source, index) => (
            <SourceCard
              key={`${source.metadata?.source}-${index}`}
              source={source}
              index={index}
              isExpanded={expandedSources.has(index)}
              onToggle={() => expandable && toggleSourceExpanded(index)}
              onPreview={onPreview}
              showMetadata={showMetadata}
            />
          ))}

          {/* Show More/Less Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {sortedSources.length - maxVisible} More Sources
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Filter Results Info */}
          {filterText && (
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              Showing {filteredSources.length} of {sources.length} sources
              {filteredSources.length === 0 && (
                <p className="mt-1">No sources match your search criteria</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}