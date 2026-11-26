"use client";

import { getDaysInMonth } from "date-fns";
import { diaDe, formatar, hoje, inicioDoDia, type Dia } from "@/lib/datas";
import type { Compromisso } from "@/lib/tipos";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * O ano inteiro numa tela (como no calendário do iPhone): os 12 meses, com os dias que têm
 * agendamento destacados. Tocar num mês abre o mês.
 */
export default function VisaoAno({
  dia,
  compromissos,
  aoEscolherMes,
}: {
  dia: Dia;
  compromissos: Compromisso[];
  aoEscolherMes: (primeiroDia: Dia) => void;
}) {
  const ano = Number(dia.slice(0, 4));
  const h = hoje();

  // Quantos agendamentos em cada dia (sem os cancelados).
  const porDia = new Map<string, number>();
  for (const c of compromissos) {
    if (c.status === "cancelado") continue;
    const d = diaDe(c.inicio);
    porDia.set(d, (porDia.get(d) ?? 0) + 1);
  }
  const doAno = [...porDia].filter(([d]) => d.startsWith(String(ano))).reduce((t, [, n]) => t + n, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-xs font-bold text-suave">
        {doAno} {doAno === 1 ? "agendamento" : "agendamentos"} em {ano}
      </p>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 md:grid-cols-4">
        {Array.from({ length: 12 }, (_, m) => {
          const primeiro = `${ano}-${String(m + 1).padStart(2, "0")}-01`;
          const data = inicioDoDia(primeiro);
          const vazios = data.getDay(); // domingo = 0
          const dias = getDaysInMonth(data);
          const mesAtual = h.slice(0, 7) === primeiro.slice(0, 7);
          const noMes = [...porDia].filter(([d]) => d.startsWith(primeiro.slice(0, 7))).reduce((t, [, n]) => t + n, 0);

          return (
            <button
              key={m}
              onClick={() => aoEscolherMes(mesAtual ? h : primeiro)}
              aria-label={`Abrir ${formatar(data, "MMMM")}`}
              className="self-start rounded-2xl p-1 text-left transition hover:bg-superficie active:scale-[0.97]"
            >
              <span className="mb-1 flex items-baseline justify-between px-0.5">
                <span className={`text-sm font-extrabold capitalize ${mesAtual ? "rounded-md bg-lima px-1 text-escuro" : ""}`}>
                  {formatar(data, "MMM").replace(".", "")}
                </span>
                {noMes > 0 && <span className="text-[10px] font-bold text-suave">{noMes}</span>}
              </span>
              <span className="grid grid-cols-7 gap-y-0.5 text-center">
                {SEMANA.map((s, i) => (
                  <span key={i} className="text-[7px] font-bold text-suave/70">
                    {s}
                  </span>
                ))}
                {Array.from({ length: vazios }, (_, i) => (
                  <span key={`v${i}`} />
                ))}
                {Array.from({ length: dias }, (_, i) => {
                  const d = `${primeiro.slice(0, 8)}${String(i + 1).padStart(2, "0")}`;
                  const n = porDia.get(d) ?? 0;
                  const ehHoje = d === h;
                  return (
                    <span
                      key={d}
                      className={`mx-auto grid size-[15px] place-items-center rounded-full text-[8.5px] leading-none font-bold ${
                        ehHoje ? "bg-tinta text-white" : n >= 3 ? "bg-lima font-extrabold text-escuro ring-1 ring-tinta/30" : n ? "bg-lima text-escuro" : ""
                      }`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 flex items-center justify-center gap-3 text-[11px] font-bold text-suave">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-tinta" /> hoje
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-lima" /> tem agendamento
        </span>
      </p>
    </div>
  );
}
