import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = { title: 'PetManager – Gestión de mascotas', description: 'Historial completo de salud, alimentación y actividad de tus mascotas' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
