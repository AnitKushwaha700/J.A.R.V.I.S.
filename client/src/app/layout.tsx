import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Mic } from "lucide-react";
import Link from "next/link";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TalkMe AI — Personal Jarvis AI Agent & English Coach",
    template: "%s | TalkMe AI",
  },
  description:
    "Voice-first personal AI assistant for speaking practice, coding interviews, career guidance, and live multilingual translation. Free forever, powered by Gemini 2.0 Flash.",
  keywords: [
    "Jarvis AI",
    "personal AI agent",
    "English speaking practice",
    "coding tutor AI",
    "career advisor AI",
    "AI voice assistant",
    "multilingual voice translator",
    "interview preparation",
  ],
  authors: [{ name: "TalkMe AI" }],
  creator: "TalkMe AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TalkMe AI",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://talkme-ai.vercel.app",
    title: "TalkMe AI — Personal Jarvis AI Agent",
    description:
      "Instant voice conversations, live grammar correction, code solving, career coaching, and 50+ language translation.",
    siteName: "TalkMe AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "TalkMe AI — Personal Jarvis AI Agent",
    description:
      "Instant voice conversations, live grammar correction, code solving, career coaching, and 50+ language translation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090a12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col relative bg-background text-foreground">
        <div className="jarvis-ambient" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="flex-1 flex flex-col min-h-screen relative z-10">
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 px-4 backdrop-blur-xl bg-background/60 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="-ml-1 hover:bg-white/5 transition-colors" />
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Jarvis Engine Online</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-[11px] text-muted-foreground">Gemini 2.0 Flash</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/voice?mode=free-talk"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Talk to Jarvis</span>
                  </Link>
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
