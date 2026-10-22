import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });

export const metadata: Metadata = {
  title: "ConsultaPet",
  description: "Historial de salud, alimentación y crecimiento de tus mascotas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${bricolage.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
