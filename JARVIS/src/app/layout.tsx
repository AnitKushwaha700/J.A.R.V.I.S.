import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
    default: "JARVIS (TalkMe) — Personal AI Voice Assistant, English Coach & Productivity Agent",
    template: "%s | JARVIS",
  },
  description:
    "A voice-first personal AI assistant, English speaking coach, mock interview mentor, and daily productivity agent powered by Grok 4.7 (xAI) and MongoDB.",
  keywords: [
    "JARVIS",
    "Grok AI",
    "xAI",
    "personal AI agent",
    "English coach",
    "mock interview",
    "voice assistant",
    "speech recognition",
    "task management",
    "software engineering mentor",
  ],
  authors: [{ name: "JARVIS" }],
  creator: "JARVIS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JARVIS",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "JARVIS — Personal AI Voice Assistant",
    description:
      "Instant voice conversations, English fluency coaching, mock interview prep, and task planning powered by Grok 4.7.",
    siteName: "JARVIS",
  },
  twitter: {
    card: "summary_large_image",
    title: "JARVIS — Personal AI Voice Assistant",
    description:
      "Instant voice conversations, English fluency coaching, mock interview prep, and task planning powered by Grok 4.7.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#091014",
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
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col relative bg-[#091014] text-[#eff7f7]" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
