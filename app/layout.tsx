import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IterMed · Clinical & Medico-Legal Lab",
  description:
    "IterMed è una piattaforma LMS medico-legale per simulazioni diagnostiche ad alta fedeltà, con valutazione clinica, Gelli-Bianco, appropriatezza, sostenibilità ed empatia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-950`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

