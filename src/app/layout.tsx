import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhostGPT",
  description:
    "GhostGPT — multi-model AI chat powered by Fireworks gpt-oss-120b.",
  icons: { icon: "/ghost.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Sora:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
