import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taïga — Transport & logistique du Québec",
  description:
    "Plateforme de transport pour les régions éloignées du Québec : Abitibi, Baie-James, Côte-Nord.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
