import type { Metadata } from "next";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "HotsDrafter - Heroes of the Storm Draft Assistant",
  description: "Intelligent hero drafting assistant for Heroes of the Storm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-cyan-600 focus:text-white focus:px-4 focus:py-2"
          >
            Skip to main content
          </a>
          {children}
          <GlobalNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
