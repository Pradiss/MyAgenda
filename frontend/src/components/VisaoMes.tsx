"use client";

import { Plus } from "lucide-react";
import Cartao from "./Cartao";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { corDe } from "@/lib/cores";
import { doDia } from "@/lib/compromissos";
import { formatar, gradeDoMes, hoje, inicioDoDia, rotuloDia, type Dia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Calendário do mês. Tocar num dia mostra a lista dele logo abaixo. */
export default function VisaoMes({
  dia,
  cat,
  compromissos,
  aoEscolher,
  aoAbrir,
  aoNovo,
  aoMudarStatus,
}: {
  dia: Dia;
  cat: Categoria;
  compromissos: Compromisso[];
  aoEscolher: (d: Dia) => void;
  aoAbrir: (c: Compromisso) => void;
  aoNovo: () => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
}) {
  const h = hoje();
  const mes = dia.slice(0, 7);
  const lista = doDia(compromissos, dia);

  return (
    <div className="flex flex-col gap-4">
      <div className="entrar rounded-[2rem] border border-linha bg-superficie p-2.5">
        <div className="grid grid-cols-7 pb-1.5 text-center text-xs font-bold text-suave">
          {SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {gradeDoMes(dia).map((d) => {
            const itens = doDia(compromissos, d).filter((c) => c.status !== "cancelado");
            const escolhido = d === dia;
            const foraDoMes = d.slice(0, 7) !== mes;
            return (
              <button
                key={d}
                onClick={() => aoEscolher(d)}
                className={`flex aspect-square flex-col items-center gap-1 rounded-2xl pt-1.5 transition ${
                  escolhido ? "bg-tinta text-white shadow-lg shadow-black/15" : foraDoMes ? "opacity-30" : "hover:bg-superficie-2"
                }`}
              >
                <span
                  className={`grid size-7 place-items-center rounded-full text-sm font-extrabold ${
                    d === h && !escolhido ? "bg-lima" : ""
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
                <span className="flex flex-wrap justify-center gap-0.5 px-1">
                  {itens.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="size-1.5 rounded-full"
                      style={{ background: escolhido ? "#ffffff" : corDe(tipoDe(cat, c.tipo).cor).forte }}
                    />
                  ))}
                  {itens.length > 3 && <span className="text-[9px] leading-none font-extrabold">+</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <h3 className="mb-2 px-1 font-extrabold">{rotuloDia(dia, "EEEE, d 'de' MMMM")}</h3>
        <div className="flex flex-col gap-2">
          {lista.map((c) => (
            <Cartao key={c.id} c={c} cat={cat} aoAbrir={aoAbrir} aoMudarStatus={aoMudarStatus} />
          ))}
          {lista.length === 0 && (
            <button onClick={aoNovo} className="flex items-center justify-center gap-1.5 rounded-3xl border border-dashed border-linha py-6 font-bold text-suave transition hover:border-tinta/30">
              <Plus size={16} /> Nada marcado. Toque para marcar.
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export const tituloMes = (dia: Dia) => {
  const t = formatar(inicioDoDia(dia), "MMMM 'de' yyyy");
  return t.charAt(0).toUpperCase() + t.slice(1);
};
