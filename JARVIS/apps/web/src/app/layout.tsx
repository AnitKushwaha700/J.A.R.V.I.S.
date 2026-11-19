import type { Metadata } from 'next';
import './globals.css';
import { DesktopShell } from '../components/DesktopShell';

export const metadata: Metadata = {
  title: 'JARVIS — Personal AI Assistant & Workspace',
  description: 'Multimodal AI Assistant & Developer Workspace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-slate-100 min-h-screen antialiased overflow-hidden" suppressHydrationWarning>
        <DesktopShell>{children}</DesktopShell>
      </body>
    </html>
  );
}
