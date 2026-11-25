"use client";

import { Check } from "lucide-react";
import { CATEGORIAS, type CategoriaId } from "@/lib/categorias";
import { corDe } from "@/lib/cores";

/** Os 3 cartões de agenda (usados na primeira escolha e no perfil). */
export default function OpcoesCategoria({ valor, aoEscolher }: { valor: CategoriaId | null; aoEscolher: (c: CategoriaId) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {CATEGORIAS.map((c, i) => {
        const escolhida = valor === c.id;
        return (
          <button
            key={c.id}
            onClick={() => aoEscolher(c.id)}
            style={{ animationDelay: `${80 + i * 70}ms` }}
            className={`entrar relative overflow-hidden rounded-[1.75rem] border p-5 text-left transition active:scale-[0.98] ${
              escolhida ? "border-tinta bg-tinta text-white shadow-xl shadow-black/15" : "border-linha bg-superficie hover:border-tinta/25"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${escolhida ? "bg-white/10" : "bg-superficie-2"}`}>
                {c.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-extrabold tracking-tight">{c.nome}</span>
                <span className={`block text-sm font-semibold ${escolhida ? "text-white/60" : "text-suave"}`}>{c.descricao}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {c.tipos
                    .filter((t) => t.id !== "outro")
                    .map((t) => (
                      <span
                        key={t.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          escolhida ? "bg-white/10 text-white/85" : "bg-superficie-2 text-suave"
                        }`}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: corDe(t.cor).forte }} />
                        {t.nome}
                      </span>
                    ))}
                </span>
              </span>
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                  escolhida ? "border-lima bg-lima text-escuro" : "border-linha"
                }`}
              >
                {escolhida && <Check size={15} strokeWidth={3} />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
