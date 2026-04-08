import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Loom Repo',
  description: 'Generated Next.js app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
