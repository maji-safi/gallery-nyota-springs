import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "The Gallery | Nyota Springs",
  description:
    "A visual journey through the rooms, landscapes and experiences of Nyota Springs.",
  openGraph: {
    title: "Nyota Springs | The Gallery",
    description: "Stay close to the extraordinary.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
