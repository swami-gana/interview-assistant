import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy("appTitle"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-16">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
