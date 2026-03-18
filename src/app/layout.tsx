import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
