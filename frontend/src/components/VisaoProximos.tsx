"use client";

import Cartao from "./Cartao";
import type { Categoria } from "@/lib/categorias";
import { diaDe, rotuloDia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

export default function VisaoProximos({
  cat,
  compromissos,
  aoAbrir,
  aoMudarStatus,
}: {
  cat: Categoria;
  compromissos: Compromisso[];
  aoAbrir: (c: Compromisso) => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
}) {
  const grupos = new Map<string, Compromisso[]>();
  for (const c of compromissos) {
    const d = diaDe(c.inicio);
    grupos.set(d, [...(grupos.get(d) ?? []), c]);
  }

  if (grupos.size === 0) {
    return (
      <div className="entrar flex flex-col items-center gap-2 py-16 text-center">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-extrabold">Nada marcado pela frente</p>
        <p className="text-suave">Toque em + para marcar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {[...grupos].map(([d, itens], gi) => (
        <section key={d} className="entrar" style={{ animationDelay: `${Math.min(gi, 8) * 50}ms` }}>
          <h3 className="mb-2 flex items-baseline justify-between px-1">
            <span className="font-extrabold">{rotuloDia(d, "EEEE, d 'de' MMM")}</span>
            <span className="text-xs font-bold text-suave">{itens.length}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {itens.map((c) => (
              <Cartao key={c.id} c={c} cat={cat} aoAbrir={aoAbrir} aoMudarStatus={aoMudarStatus} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
