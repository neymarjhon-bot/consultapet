export default function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <div className="flash err" role="alert">{error}</div>;
  if (ok) return <div className="flash ok" role="status">{ok}</div>;
  return null;
}
