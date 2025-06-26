"use client";

import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import CookieConsent from "./components/cookie-consent";
import SupabaseProvider from "./supabase-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <SupabaseProvider>
          <Navbar />
          {children}
          <Footer />
          <CookieConsent />
        </SupabaseProvider>
      </body>
    </html>
  );
}
