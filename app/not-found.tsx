import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="login">
      <div className="card">
        <h1 style={{ color: 'var(--brand)' }}>Página no encontrada</h1>
        <p className="sub" style={{ margin: '.6rem 0 1rem' }}>
          La página que buscas no existe o no tienes permiso para verla.
        </p>
        <Link className="btn" href="/">Volver al inicio</Link>
      </div>
    </main>
  );
}
