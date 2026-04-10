import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppMotionProvider } from "@/components/motion/AppMotionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LoA Scheduler",
  description: "게임 정보 및 커뮤니티 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" data-theme="dim">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-base-100 text-base-content min-h-screen antialiased`}
      >
        <AppMotionProvider>{children}</AppMotionProvider>
      </body>
    </html>
  );
}
