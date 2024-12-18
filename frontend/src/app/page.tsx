'use client';

import Game from "@/components/Game";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 sm:p-4 lg:px-24">
      <Game />
    </main>
  );
}