// For adding custom fonts with other frameworks, see:
// https://tailwindcss.com/docs/font-family
import type { Metadata } from "next";
import { Source_Serif_4, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local"
import "./globals.css";

// const fontSans = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });

const sfPro = localFont({
  src: './(fonts)/SF-Pro.ttf', 
  variable: '--font-sf-pro', 
  weight: '10 900',         
  display: 'swap',
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BeeZ - Biz made eZ",
  description: "Analisis Data Bisnismu Lebih Mudah ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${sfPro.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}