export default function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink/70 bg-white border border-[#dbe5e1] rounded-md p-3">{children}</p>;
}
