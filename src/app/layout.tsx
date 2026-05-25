import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Sites bd | Free Subdomain & Domain Registration & NVMe SSD Web Hosting in Bangladesh",
  description: "Sites.bd offers affordable domain registration, NVMe SSD web hosting, email hosting, and web design services in Bangladesh. Free SSL, backups, and 24/7 support included.",
  keywords: "domain registration Bangladesh, cheap web hosting BD, NVMe SSD hosting, buy domain BD, web design Bangladesh, email hosting BD",
  authors: [{ name: "Sites.bd" }],
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1.0",
  openGraph: {
    title: "Web Sites bd | Free Subdomain & Domain Registration & NVMe SSD Web Hosting in Bangladesh",
    description: "Affordable domain names, NVMe SSD hosting, email hosting, and web design services in Bangladesh. Free SSL & 24/7 support.",
    type: "website",
    url: "https://sites.bd/",
    siteName: "Sites.bd",
    images: [
      {
        url: "https://sites.bd/og.webp",
        width: 1200,
        height: 630,
        alt: "Sites.bd",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sites.bd | Domain Registration & Hosting",
    description: "Get affordable domains & NVMe SSD hosting in Bangladesh. Free SSL, backups, and 24/7 support.",
    images: ["https://sites.bd/og.webp"],
    site: "@sitesbd",
  },
  alternates: {
    canonical: "https://sites.bd/",
  },
  other: {
    "geo.region": "BD-DH",
    "geo.placename": "Dhaka, Bangladesh",
    "geo.position": "23.8103;90.4125",
    "ICBM": "23.8103, 90.4125",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden bg-gray-50">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
