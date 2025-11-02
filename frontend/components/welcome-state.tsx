import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Upload,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
  FileText,
  Brain,
  Shield,
  ChevronDown,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeStateProps {
  onPromptSelect: (prompt: string) => void;
  onFileUpload: () => void;
  onStartChatting: () => void;
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PromptItem {
  text: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: "AI-Powered Analysis",
    description: "Advanced language models understand your documents and provide accurate answers"
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "PDF Document Support",
    description: "Upload and analyze PDF documents of any size with automatic text extraction"
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Privacy First",
    description: "Your documents are processed securely with enterprise-grade data protection"
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Lightning Fast",
    description: "Get instant responses with optimized performance and streaming answers"
  }
];

const examplePrompts: PromptItem[] = [
  {
    text: "What are the main topics covered in this document?",
    icon: <Target className="w-4 h-4" />,
    category: "General",
    color: "bg-blue-500"
  },
  {
    text: "Summarize the key findings from the research paper",
    icon: <BarChart3 className="w-4 h-4" />,
    category: "Analysis",
    color: "bg-green-500"
  },
  {
    text: "What data sources were used in this study?",
    icon: <Lightbulb className="w-4 h-4" />,
    category: "Research",
    color: "bg-purple-500"
  },
  {
    text: "Explain the methodology used in this document",
    icon: <BookOpen className="w-4 h-4" />,
    category: "Learning",
    color: "bg-orange-500"
  },
  {
    text: "What are the conclusions and recommendations?",
    icon: <Sparkles className="w-4 h-4" />,
    category: "Summary",
    color: "bg-pink-500"
  },
  {
    text: "Are there any limitations mentioned in this work?",
    icon: <MessageSquare className="w-4 h-4" />,
    category: "Critical",
    color: "bg-red-500"
  }
];

export function WelcomeState({ onPromptSelect, onFileUpload, onStartChatting }: WelcomeStateProps) {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto space-y-8"
      >
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="text-center space-y-6"
        >
          {/* Animated Gradient Background */}
          <div className="relative">
            <div className="absolute inset-0 gradient-bg rounded-3xl opacity-10 blur-3xl" />
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-bg mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-fluid-xl font-bold gradient-text">
              AI-Powered Document Intelligence
            </h1>
            <p className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload your PDF documents and get instant, intelligent answers.
              Powered by advanced AI that truly understands your content.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              This AI chatbot template accompanies the book{' '}
              <a
                href="https://www.oreilly.com/library/view/learning-langchain/9781098167271/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Learning LangChain (O'Reilly): Building AI and LLM applications with LangChain and LangGraph
              </a>
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="touch-target group"
              onClick={onFileUpload}
            >
              <Upload className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              Upload Documents
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="touch-target"
              onClick={() => setShowPrompts(!showPrompts)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Try Example Prompts
              <ChevronDown
                className={cn(
                  "w-4 h-4 ml-2 transition-transform duration-200",
                  showPrompts && "rotate-180"
                )}
              />
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg border-border/50",
                  expandedFeature === index && "ring-2 ring-primary/50"
                )}
                onClick={() => setExpandedFeature(expandedFeature === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">
                        {feature.title}
                      </h3>
                      <AnimatePresence>
                        {expandedFeature === index ? (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-muted-foreground"
                          >
                            {feature.description}
                          </motion.p>
                        ) : (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-muted-foreground line-clamp-2"
                          >
                            {feature.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Example Prompts */}
        <AnimatePresence>
          {showPrompts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              variants={itemVariants}
              className="space-y-4"
            >
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Get Started with Example Prompts</h2>
                <p className="text-sm text-muted-foreground">
                  Click any prompt below to begin exploring your documents
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {examplePrompts.map((prompt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all duration-200 group border-border/50"
                      onClick={() => {
                        onPromptSelect(prompt.text);
                        onStartChatting();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white",
                            prompt.color
                          )}>
                            {prompt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {prompt.category}
                            </span>
                            <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors">
                              {prompt.text}
                            </p>
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

        {/* Getting Started Guide */}
        <motion.div
          variants={itemVariants}
          className="text-center space-y-4 pt-8 border-t border-border/50"
        >
          <h2 className="text-lg font-semibold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3">
                <span className="text-lg font-bold">1</span>
              </div>
              <h3 className="font-medium text-sm">Upload Documents</h3>
              <p className="text-xs text-muted-foreground">
                Add PDF files using drag-and-drop or the upload button
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3">
                <span className="text-lg font-bold">2</span>
              </div>
              <h3 className="font-medium text-sm">Ask Questions</h3>
              <p className="text-xs text-muted-foreground">
                Type your questions or use example prompts to get started
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3">
                <span className="text-lg font-bold">3</span>
              </div>
              <h3 className="font-medium text-sm">Get Answers</h3>
              <p className="text-xs text-muted-foreground">
                Receive detailed responses with source citations from your documents
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}