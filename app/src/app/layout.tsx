import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunset Protocol | Graceful exits for agent tokens",
  description: "When tokens die, holders get value back. Fee stream coverage for Clanker, Bankr, and Clawnch tokens on Base.",
  openGraph: {
    title: "Sunset Protocol",
    description: "Graceful exits for agent tokens. When tokens die, holders get value back.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
