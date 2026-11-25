"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OpcoesCategoria from "./OpcoesCategoria";
import type { CategoriaId } from "@/lib/categorias";
import { salvarCategoria } from "@/lib/perfil";

/** Primeiro acesso: escolher a agenda uma vez. Depois só muda pelo Perfil. */
export default function EscolherCategoria() {
  const router = useRouter();
  const [escolha, setEscolha] = useState<CategoriaId | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function comecar() {
    if (!escolha) return;
    setSalvando(true);
    setErro("");
    try {
      await salvarCategoria(escolha);
      router.replace("/");
      router.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  return (
    <main className="brilho min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="entrar">
          <span className="rounded-full border border-linha bg-superficie px-3 py-1 text-xs font-bold text-suave">Passo único</span>
          <h1 className="mt-4 text-4xl leading-[1.2] font-extrabold tracking-tight">
            Qual é a sua <span className="inline-block rounded-xl bg-lima px-2 leading-[1.15]">agenda</span>?
          </h1>
          <p className="mt-2 text-suave">Escolha uma vez. Dá para trocar depois no seu perfil.</p>
        </div>

        <div className="mt-7 flex-1">
          <OpcoesCategoria valor={escolha} aoEscolher={setEscolha} />
        </div>

        {erro && <p className="mt-4 rounded-2xl bg-coral/12 px-4 py-2 text-sm font-bold text-coral">{erro}</p>}

        <button
          onClick={comecar}
          disabled={!escolha || salvando}
          className="arco mt-6 flex h-15 items-center justify-center gap-2 rounded-full text-lg font-extrabold text-white shadow-xl shadow-black/15 transition active:scale-[0.98] disabled:opacity-30"
        >
          {salvando ? "Preparando…" : "Começar"} {!salvando && <ArrowRight size={20} />}
        </button>
      </div>
    </main>
  );
}
