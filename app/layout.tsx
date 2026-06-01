import type { Metadata } from "next";
import { GoogleAnalytics } from "./components/google-analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentic.im996.com"),
  title: "Agentic Lite",
  description: "A lightweight AI assistant for quick answers, writing, research, and task planning.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Agentic Lite",
    description: "Assign a task or ask anything with a lightweight AI assistant.",
    url: "/",
    siteName: "Agentic Lite",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Agentic Lite AI assistant"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Lite",
    description: "Assign a task or ask anything with a lightweight AI assistant.",
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
