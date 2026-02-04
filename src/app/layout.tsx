import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBITAL ROXA | Streetwear Gamer Underground",
  description: "Streetwear com alma gamer. Criamos peças oversized pra quem vive entre o digital e a rua. Stay in the game.",
  keywords: ["streetwear", "gamer", "CS2", "esports", "oversized", "underground", "drops limitados"],
  openGraph: {
    title: "ORBITAL ROXA | Stay in the Game",
    description: "Streetwear gamer underground. Drops limitados. Exclusividade real.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {/* Noise overlay for texture */}
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
