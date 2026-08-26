import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const image = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/og.png` : undefined;
  const description = "A personal recipe box and cooking journal for recipes worth making again.";

  return {
    title: { default: "Rasoi Notes", template: "%s · Rasoi Notes" },
    description,
    openGraph: image ? { title: "Rasoi Notes", description, images: [{ url: image }] } : undefined,
    twitter: image ? { card: "summary_large_image", title: "Rasoi Notes", description, images: [image] } : undefined,
  };
}

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
