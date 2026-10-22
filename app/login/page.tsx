"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const email = f.get("email") as string;
    const password = f.get("password") as string;
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Correo o contraseña incorrectos.");
      else { router.push("/pets"); router.refresh(); }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: f.get("full_name") } },
      });
      setMsg(error ? error.message : "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
    }
    setBusy(false);
  }

  return (
    <main className="min-h-dvh grid md:grid-cols-2">
      <section className="bg-pine text-white p-8 md:p-14 flex flex-col justify-end">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight">ConsultaPet</h1>
        <p className="mt-4 max-w-sm text-white/80">
          Vacunas, controles, alimentación y peso de cada una de tus mascotas, en un solo lugar y por año.
        </p>
      </section>
      <section className="p-8 md:p-14 flex items-center">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
          {mode === "register" && (
            <input name="full_name" required placeholder="Nombre completo" className="field" />
          )}
          <input name="email" type="email" required placeholder="Correo" className="field" autoComplete="email" />
          <input name="password" type="password" required minLength={8} placeholder="Contraseña (mínimo 8)" className="field"
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
          {msg && <p role="status" className="text-sm text-alert">{msg}</p>}
          <button disabled={busy} className="btn w-full">{mode === "login" ? "Entrar" : "Crear cuenta"}</button>
          <button type="button" className="text-sm underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(null); }}>
            {mode === "login" ? "No tengo cuenta" : "Ya tengo cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}
