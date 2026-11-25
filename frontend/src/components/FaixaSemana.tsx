"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { corDe } from "@/lib/cores";
import { doDia } from "@/lib/compromissos";
import { diasDaSemana, formatar, hoje, inicioDoDia, somarDias, type Dia } from "@/lib/datas";
import type { Compromisso } from "@/lib/tipos";

/** Os 7 dias da semana, com bolinhas coloridas de quantos compromissos tem em cada um. */
export default function FaixaSemana({
  dia,
  cat,
  compromissos,
  aoEscolher,
}: {
  dia: Dia;
  cat: Categoria;
  compromissos: Compromisso[];
  aoEscolher: (d: Dia) => void;
}) {
  const h = hoje();
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => aoEscolher(somarDias(dia, -7))} aria-label="Semana anterior" className="grid h-16 w-7 shrink-0 place-items-center text-suave hover:text-tinta">
        <ChevronLeft size={20} />
      </button>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {diasDaSemana(dia).map((d) => {
          const itens = doDia(compromissos, d).filter((c) => c.status !== "cancelado");
          const escolhido = d === dia;
          return (
            <button
              key={d}
              onClick={() => aoEscolher(d)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 transition ${
                escolhido ? "bg-tinta text-white shadow-lg shadow-black/15" : "bg-superficie hover:bg-superficie-2"
              }`}
            >
              <span className={`text-[11px] font-bold uppercase ${escolhido ? "opacity-70" : "text-suave"}`}>
                {formatar(inicioDoDia(d), "EEEEEE")}
              </span>
              <span className={`text-lg leading-tight font-extrabold ${d === h && !escolhido ? "rounded-md bg-lima px-1" : ""}`}>
                {formatar(inicioDoDia(d), "d")}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {itens.slice(0, 4).map((c) => (
                  <span
                    key={c.id}
                    className="size-1.5 rounded-full"
                    style={{ background: escolhido ? "#ffffff" : corDe(tipoDe(cat, c.tipo).cor).forte }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={() => aoEscolher(somarDias(dia, 7))} aria-label="Próxima semana" className="grid h-16 w-7 shrink-0 place-items-center text-suave hover:text-tinta">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
