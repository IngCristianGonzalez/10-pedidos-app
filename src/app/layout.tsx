import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { HorarioProvider } from "@/lib/horario";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Gigi Papas | Comidas Rápidas",
  description: "Gigi Papas Comidas Rápidas Pedidos por mesa con QR",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/images/logo-gigi.jpeg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [{ url: "/apple-icon.jpg", sizes: "180x180", type: "image/jpeg" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: { capable: true, title: "Gigi Papas", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <StoreProvider>
            <HorarioProvider>{children}</HorarioProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
