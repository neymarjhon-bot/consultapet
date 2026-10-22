import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { ROLE } from "@/lib/labels";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const link = "px-2 py-1 rounded hover:bg-white/10";
  return (
    <>
      <nav className="bg-pine text-white">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-1 px-4 py-2 text-sm">
          <Link href="/pets" className="font-extrabold text-lg mr-3">ConsultaPet</Link>
          <Link href="/pets" className={link}>Mis mascotas</Link>
          {profile.role === "vet" && <Link href="/vet" className={link}>Mis pacientes</Link>}
          {profile.role === "admin" && <Link href="/admin" className={link}>Administración</Link>}
          <Link href="/profile" className={link}>Perfil</Link>
          <span className="ml-auto text-white/70">{profile.full_name} ({ROLE[profile.role]})</span>
          <form action={signOut}><button className={link}>Salir</button></form>
        </div>
      </nav>
      <div className="mx-auto max-w-4xl p-5 md:p-8">{children}</div>
    </>
  );
}
