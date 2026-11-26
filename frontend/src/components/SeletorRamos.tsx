"use client";

import { Check } from "lucide-react";
import type { Ramo } from "@/lib/categorias";
import { corDe } from "@/lib/cores";

/** Escolha de vários ramos (ex.: Cílios + Sobrancelhas). */
export default function SeletorRamos({
  ramos,
  selecionados,
  aoMudar,
}: {
  ramos: Ramo[];
  selecionados: string[];
  aoMudar: (ids: string[]) => void;
}) {
  const alternar = (id: string) =>
    aoMudar(selecionados.includes(id) ? selecionados.filter((x) => x !== id) : [...selecionados, id]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {ramos.map((r, i) => {
        const ativo = selecionados.includes(r.id);
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => alternar(r.id)}
            aria-pressed={ativo}
            style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            className={`entrar relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.97] ${
              ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-superficie hover:border-tinta/25"
            }`}
          >
            <span className="flex w-full items-center justify-between">
              <span className="text-xl leading-none">{r.emoji}</span>
              <span
                className={`grid size-5 place-items-center rounded-full border-2 ${ativo ? "border-lima bg-lima text-escuro" : "border-linha"}`}
              >
                {ativo && <Check size={12} strokeWidth={3.5} />}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm leading-tight font-extrabold">
              <span className="size-2 shrink-0 rounded-full" style={{ background: corDe(r.cor).forte }} />
              {r.nome}
            </span>
            <span className={`line-clamp-2 text-[11px] leading-snug font-semibold ${ativo ? "text-white/60" : "text-suave"}`}>
              {r.servicos
                .slice(0, 4)
                .map((s) => s.nome)
                .join(", ")}
              …
            </span>
          </button>
        );
      })}
    </div>
  );
}
