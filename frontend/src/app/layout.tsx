import type { Metadata, Viewport } from "next";
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { Providers } from './Providers';

export const metadata: Metadata = {
  title: "Web3 Snake Game",
  description: "Snake Game with Web3 Integration",
};

export const viewport: Viewport = {
  themeColor: "black",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}