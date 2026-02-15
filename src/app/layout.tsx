import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veriloop | Hiring Intelligence Platform",
  description:
    "Veriloop helps teams run policy-driven hiring with requirement-level scoring, trust-weighted referrals, and transparent applicant feedback.",
  icons: {
    icon: "/Veriloop.png",
    shortcut: "/Veriloop.png",
    apple: "/Veriloop.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
