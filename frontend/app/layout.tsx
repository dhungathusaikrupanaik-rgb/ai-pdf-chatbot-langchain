import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

export const metadata: Metadata = {
  title: "AI PDF Chatbot - Learning LangChain Demo",
  description: "An intelligent PDF document chatbot powered by LangChain and LangGraph. Upload documents and ask questions to get AI-powered answers with source citations.",
  keywords: ["AI", "Chatbot", "PDF", "LangChain", "LangGraph", "Document Analysis", "Machine Learning"],
  authors: [{ name: "Learning LangChain" }],
  creator: "O'Reilly Media",
  publisher: "O'Reilly Media",
  robots: "index, follow",
  openGraph: {
    title: "AI PDF Chatbot - Learning LangChain Demo",
    description: "Upload PDF documents and chat with AI to get intelligent answers with source citations.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI PDF Chatbot - Learning LangChain Demo",
    description: "Upload PDF documents and chat with AI to get intelligent answers with source citations.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className="scroll-smooth"
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/geist-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Theme and accessibility */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />

        {/* Accessibility */}
        <meta name="accessibility" content="WCAG 2.1 AA compliant" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Skip link for accessibility */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .skip-link {
              position: absolute;
              top: -40px;
              left: 6px;
              background: var(--primary);
              color: var(--primary-foreground);
              padding: 8px;
              text-decoration: none;
              border-radius: 4px;
              z-index: 100;
              transition: top 0.3s;
            }
            .skip-link:focus {
              top: 6px;
            }
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          `
        }} />
      </head>
      <body
        className={GeistSans.className}
        suppressHydrationWarning={true}
      >
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="skip-link"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        {/* Main content wrapper */}
        <div id="main-content" role="main" aria-live="polite">
          {children}
        </div>

        {/* Global notifications */}
        <Toaster />

        {/* Screen reader announcements */}
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          id="screen-reader-announcements"
        />
      </body>
    </html>
  )
}