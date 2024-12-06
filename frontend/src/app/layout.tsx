import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Web3 Snake Game",
  description: "Experience the classic Snake game reimagined for Web3. Challenge yourself across 5 difficulty levels and compete for the highest scores on the blockchain-powered leaderboard.",
  keywords: ["Web3", "Snake Game", "Blockchain Game", "NFT Game", "Play to Earn", "Crypto Gaming"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "Web3 Snake Game",
    description: "Play the classic Snake game with a Web3 twist! Compete globally and top the leaderboards.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web3 Snake Game",
    description: "Play the classic Snake game with a Web3 twist! Compete globally and top the leaderboards.",
    images: ["/og-image.png"],
  },
};

// Viewport configuration with theme color that adapts to color scheme
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
