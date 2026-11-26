"use client";

import { Check } from "lucide-react";
import { TEMAS } from "@/lib/temas";

/** Amostras dos temas: cada uma mostra o fundo, o cartão principal e a cor de destaque. */
export default function SeletorTema({ valor, aoEscolher }: { valor: string; aoEscolher: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TEMAS.map((t) => {
        const ativo = t.id === valor;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => aoEscolher(t.id)}
            aria-pressed={ativo}
            aria-label={`Tema ${t.nome}`}
            className="flex flex-col items-center gap-1.5 transition active:scale-95"
          >
            <span
              className={`relative flex aspect-[3/4] w-full flex-col justify-end gap-1 overflow-hidden rounded-2xl border-2 p-1.5 ${
                ativo ? "border-tinta" : "border-linha"
              }`}
              style={{ background: t.fundo }}
            >
              <span className="h-1/2 w-full rounded-lg" style={{ background: t.tinta }}>
                <span className="mx-1.5 mt-2 block h-1 w-2/3 rounded-full" style={{ background: t.destaque }} />
              </span>
              <span className="h-2.5 w-full rounded-md" style={{ background: t.superficie2 }} />
              {ativo && (
                <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full" style={{ background: t.destaque, color: t.tinta }}>
                  <Check size={12} strokeWidth={3.5} />
                </span>
              )}
            </span>
            <span className={`text-[11px] font-bold ${ativo ? "text-tinta" : "text-suave"}`}>{t.nome}</span>
          </button>
        );
      })}
    </div>
  );
}
