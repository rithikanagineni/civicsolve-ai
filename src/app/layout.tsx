import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicSolve AI — From Citizen Problems to Collaborative Solutions",
  description:
    "An AI-powered civic innovation platform connecting citizens, universities and industries to transform real-world societal problems into measurable solutions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
