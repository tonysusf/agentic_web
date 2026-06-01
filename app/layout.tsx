import type { Metadata } from "next";
import { GoogleAnalytics } from "./components/google-analytics";
import "./globals.css";

const siteDescription =
  "Agentic Lite is a lightweight AI assistant for quick answers, writing help, research summaries, travel planning, and everyday task support.";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentic.im996.com"),
  title: "Agentic Lite",
  description: siteDescription,
  applicationName: "Agentic Lite",
  authors: [{ name: "Agentic Lite" }],
  creator: "Agentic Lite",
  publisher: "Agentic Lite",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Agentic Lite",
    description: siteDescription,
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
    description: siteDescription,
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
