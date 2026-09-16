import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PwaRegister } from "@/components/PwaRegister";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy("appTitle"),
  applicationName: copy("appTitle"),
  appleWebApp: {
    capable: true,
    title: copy("appTitle"),
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-16">
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
