"use client";

import { Inter, Roboto } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider";
import { PushNotificationProvider } from "@/providers/push-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-family",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-family",
  display: "swap",
});

const nunito = { variable: "--font-nunito-family" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/logo-short.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${roboto.variable} ${nunito.variable} min-h-screen bg-background antialiased`}
      >
        <AuthProvider>
          <PushNotificationProvider>
            {children}
            <ToastContainer />
          </PushNotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
