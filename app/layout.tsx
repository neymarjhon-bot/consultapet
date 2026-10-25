import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: 'ConsultaPet — Gestión de mascotas', description: 'Historial de salud, alimentación y crecimiento de tus mascotas.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>{children}</body></html>);
}
