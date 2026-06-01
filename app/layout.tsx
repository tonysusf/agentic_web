import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://agentic.im996.com"),
  title: "Agentic Lite",
  description: "Agentic AI task assistant mockup for web and mobile.",
  openGraph: {
    title: "Agentic Lite",
    description: "Assign a task or ask anything.",
    url: "http://agentic.im996.com",
    siteName: "Agentic Lite",
    type: "website"
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F58TN9LYQ8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F58TN9LYQ8');
          `}
        </Script>
      </body>
    </html>
  );
}
