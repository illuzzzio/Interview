import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
// import BackAudio from "@/components/BackAudio";

const Shader = dynamic(() => import("@/components/Shader"), { ssr: false });

export const metadata: Metadata = {
  title: "EzzHire",
  description: "Practice as many mock interviews with my platform ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className = "dark">
      <body className="antialiased">
        {/* <BackAudio/> */}
        <Shader />
        {children}
        <Toaster/>
      </body>
    </html>
  );
}
