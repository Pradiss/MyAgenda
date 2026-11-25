"use client";

import { LogOut, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OpcoesCategoria from "./OpcoesCategoria";
import { categoriaDe, type Categoria, type CategoriaId } from "@/lib/categorias";
import { sair, salvarCategoria } from "@/lib/perfil";

export default function Perfil({ cat, email }: { cat: Categoria; email: string }) {
  const router = useRouter();
  const [trocandoPara, setTrocandoPara] = useState<CategoriaId | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const nova = trocandoPara ? categoriaDe(trocandoPara) : null;

  async function confirmarTroca() {
    if (!trocandoPara) return;
    setSalvando(true);
    setErro("");
    try {
      await salvarCategoria(trocandoPara);
      router.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="entrar flex items-center gap-4 rounded-[2rem] border border-linha bg-superficie p-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-lima text-2xl font-extrabold text-escuro uppercase">
          {email.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-suave">Sua conta</p>
          <p className="truncate text-lg font-extrabold">{email}</p>
          <p className="text-sm font-semibold text-suave">
            Agenda: {cat.emoji} {cat.nome}
          </p>
        </div>
      </section>

      <section className="entrar" style={{ animationDelay: "60ms" }}>
        <h2 className="mb-1 px-1 font-extrabold">Trocar de agenda</h2>
        <p className="mb-3 px-1 text-sm text-suave">Os compromissos de cada agenda ficam guardados. Trocando, você vê os da outra.</p>
        <OpcoesCategoria valor={trocandoPara ?? cat.id} aoEscolher={(c) => setTrocandoPara(c === cat.id ? null : c)} />

        {nova && (
          <div className="entrar mt-3 rounded-3xl border border-linha bg-superficie-2 p-4">
            <p className="font-bold">
              Trocar para {nova.emoji} {nova.nome}?
            </p>
            {erro && <p className="mt-2 text-sm font-bold text-coral">{erro}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setTrocandoPara(null)} className="rounded-2xl bg-fundo py-3 font-extrabold text-suave">
                Cancelar
              </button>
              <button
                onClick={confirmarTroca}
                disabled={salvando}
                className="rounded-2xl bg-tinta py-3 font-extrabold text-white disabled:opacity-50"
              >
                {salvando ? "Trocando…" : "Trocar"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="entrar flex gap-3 rounded-3xl border border-linha bg-superficie p-4" style={{ animationDelay: "120ms" }}>
        <Smartphone className="mt-0.5 shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-extrabold">Use como app</p>
          <p className="text-suave">
            iPhone: Safari → Compartilhar → <b className="text-tinta">Adicionar à Tela de Início</b>. Android: Chrome → ⋮ →{" "}
            <b className="text-tinta">Instalar app</b>.
          </p>
        </div>
      </section>

      <button
        onClick={async () => {
          await sair();
          router.replace("/login");
          router.refresh();
        }}
        className="entrar flex items-center justify-center gap-2 rounded-2xl border border-linha py-3.5 font-extrabold text-coral transition hover:bg-coral/10"
        style={{ animationDelay: "180ms" }}
      >
        <LogOut size={18} /> Sair da conta
      </button>
    </div>
  );
}
