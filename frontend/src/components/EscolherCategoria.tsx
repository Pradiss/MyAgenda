"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OpcoesCategoria from "./OpcoesCategoria";
import SeletorRamos from "./SeletorRamos";
import { categoriaDe, type CategoriaId } from "@/lib/categorias";
import { salvarCategoria } from "@/lib/perfil";

/**
 * Primeiro acesso: 1) escolher a agenda; 2) na Estética, escolher os ramos (cílios, sobrancelhas…).
 * Depois só muda pelo Perfil.
 */
export default function EscolherCategoria({ inicial = null }: { inicial?: CategoriaId | null }) {
  const router = useRouter();
  const [escolha, setEscolha] = useState<CategoriaId | null>(inicial);
  const [passo, setPasso] = useState<1 | 2>(inicial ? 2 : 1);
  const [ramos, setRamos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const cat = escolha ? categoriaDe(escolha) : undefined;
  const temRamos = Boolean(cat?.ramos);
  const pronto = escolha && (!temRamos || (passo === 2 && ramos.length > 0));

  async function avancar() {
    if (!escolha) return;
    if (temRamos && passo === 1) {
      setPasso(2);
      window.scrollTo({ top: 0 });
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await salvarCategoria(escolha, temRamos ? ramos : undefined);
      router.replace("/");
      router.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  return (
    <main className="brilho min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {passo === 1 ? (
          <div className="entrar">
            <span className="rounded-full border border-linha bg-superficie px-3 py-1 text-xs font-bold text-suave">
              Passo 1{temRamos ? " de 2" : ""}
            </span>
            <h1 className="mt-3 text-3xl leading-[1.2] font-extrabold tracking-tight">
              Qual é a sua <span className="inline-block rounded-xl bg-lima px-2 leading-[1.15]">agenda</span>?
            </h1>
            <p className="mt-1.5 text-sm text-suave">Escolha uma vez. Dá para trocar depois no seu perfil.</p>
          </div>
        ) : (
          <div className="entrar">
            {!inicial && (
              <button onClick={() => setPasso(1)} className="mb-3 flex items-center gap-1 text-sm font-bold text-suave hover:text-tinta">
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            <span className="rounded-full border border-linha bg-superficie px-3 py-1 text-xs font-bold text-suave">Passo 2 de 2</span>
            <h1 className="mt-3 text-3xl leading-[1.2] font-extrabold tracking-tight">
              O que você <span className="inline-block rounded-xl bg-lima px-2 leading-[1.15]">faz</span>?
            </h1>
            <p className="mt-1.5 text-sm text-suave">
              Marque um ou mais. Na hora de agendar, só aparecem os serviços desses ramos. Dá para mudar depois no perfil.
            </p>
          </div>
        )}

        <div className="mt-5 flex-1">
          {passo === 1 ? (
            <OpcoesCategoria
              valor={escolha}
              aoEscolher={(c) => {
                setEscolha(c);
                setRamos([]);
              }}
            />
          ) : (
            cat?.ramos && <SeletorRamos ramos={cat.ramos} selecionados={ramos} aoMudar={setRamos} />
          )}
        </div>

        {erro && <p className="mt-4 rounded-2xl bg-coral/12 px-4 py-2 text-sm font-bold text-coral">{erro}</p>}

        <div className="sticky bottom-0 -mx-4 mt-4 bg-fundo/90 px-4 pt-2 pb-1 backdrop-blur">
          <button
            onClick={avancar}
            disabled={(passo === 1 ? !escolha : !pronto) || salvando}
            className="arco flex h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-extrabold text-white shadow-xl shadow-black/15 transition active:scale-[0.98] disabled:opacity-30"
          >
            {salvando ? "Preparando…" : temRamos && passo === 1 ? "Continuar" : "Começar"}
            {!salvando && <ArrowRight size={20} />}
          </button>
          {passo === 2 && ramos.length > 0 && (
            <p className="mt-1.5 text-center text-xs font-bold text-suave">
              {ramos.length} {ramos.length > 1 ? "ramos escolhidos" : "ramo escolhido"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
