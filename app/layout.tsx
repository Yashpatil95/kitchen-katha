import type { Metadata } from "next";
import "./globals.css";

const description = "A personal recipe box and cooking journal for recipes worth making again.";
const image = "https://kitchen-katha.patilyash280699.chatgpt.site/og.png";

export const metadata: Metadata = {
  title: { default: "Kitchen Katha", template: "%s · Kitchen Katha" },
  description,
  openGraph: { title: "Kitchen Katha", description, images: [{ url: image }] },
  twitter: { card: "summary_large_image", title: "Kitchen Katha", description, images: [image] },
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
