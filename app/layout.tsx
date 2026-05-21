import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Institutional Portfolio Dashboard",
  description: "Private banking portfolio dashboard demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
