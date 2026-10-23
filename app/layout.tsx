import './globals.css'
import type { Metadata, Viewport } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = { title: 'ConsultaPet', description: 'Historial de salud, alimentación y crecimiento de tus mascotas' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
