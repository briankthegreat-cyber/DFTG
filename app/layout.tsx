import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "Cosmic Drift — Eat the Universe";
  const description =
    "Begin as stardust, absorb smaller celestial bodies, outmaneuver cosmic giants, and become the end of everything.";
  const image = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: title,
      template: "%s · Cosmic Drift",
    },
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: image, width: 1536, height: 1024, alt: "Cosmic Drift: Eat the Universe" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#06091d",
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
