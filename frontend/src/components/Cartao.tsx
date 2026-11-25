"use client";

import { Check, MapPin, Repeat, UserRound } from "lucide-react";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { estiloCor } from "@/lib/cores";
import { dinheiro, hora } from "@/lib/datas";
import { ROTULO_STATUS, type Compromisso, type Status } from "@/lib/tipos";

export const ESTILO_STATUS: Record<Status, string> = {
  marcado: "bg-superficie-2 text-suave",
  confirmado: "bg-ceu/10 text-ceu",
  pago: "bg-lima text-escuro",
  feito: "bg-lima text-escuro",
  cancelado: "bg-coral/10 text-coral",
};

/** Próximo status ao tocar na etiqueta (pula o "cancelado", que fica no detalhe). */
function proximo(cat: Categoria, s: Status): Status {
  const ciclo: Status[] = cat.status.filter((x) => x !== "cancelado");
  return ciclo[(ciclo.indexOf(s) + 1) % ciclo.length];
}

export function EtiquetaStatus({ status, cat, aoMudar }: { status: Status; cat: Categoria; aoMudar: (s: Status) => void }) {
  const feito = status === "pago" || status === "feito";
  return (
    <button
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition active:scale-95 ${ESTILO_STATUS[status]}`}
      title="Toque para mudar o status"
      onClick={(e) => {
        e.stopPropagation();
        aoMudar(proximo(cat, status));
      }}
    >
      {feito && <Check size={12} strokeWidth={3} />}
      {ROTULO_STATUS[status]}
    </button>
  );
}

/** Cartão de compromisso: bloco colorido com o horário + informações. */
export default function Cartao({
  c,
  cat,
  aoAbrir,
  aoMudarStatus,
  passou = false,
}: {
  c: Compromisso;
  cat: Categoria;
  aoAbrir: (c: Compromisso) => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
  passou?: boolean;
}) {
  const tipo = tipoDe(cat, c.tipo);
  const cancelado = c.status === "cancelado";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => aoAbrir(c)}
      onKeyDown={(e) => e.key === "Enter" && aoAbrir(c)}
      style={estiloCor(tipo.cor)}
      className={`group flex w-full cursor-pointer items-stretch gap-3 rounded-3xl border border-linha bg-superficie p-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-tinta/20 active:scale-[0.985] ${
        cancelado || passou ? "border-dashed bg-transparent shadow-none" : ""
      }`}
    >
      <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-superficie-2 py-2.5">
        {c.dia_inteiro ? (
          <span className="text-xs leading-tight font-extrabold">Dia todo</span>
        ) : (
          <>
            <span className="text-lg leading-none font-extrabold tracking-tight">{hora(c.inicio)}</span>
            <span className="mt-1 text-[11px] font-bold text-suave">{hora(c.fim)}</span>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-suave">
          <span className="size-2 rounded-full bg-(--c)" />
          {tipo.nome}
          {c.serie_id && <Repeat size={11} />}
        </div>
        <div className={`truncate text-[17px] leading-snug font-extrabold tracking-tight ${cancelado ? "line-through" : ""}`}>{c.titulo}</div>
        {(c.cliente || c.local) && (
          <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-suave">
            {c.local ? <MapPin size={13} className="shrink-0" /> : <UserRound size={13} className="shrink-0" />}
            <span className="truncate">{[c.cliente, c.local].filter(Boolean).join(" · ")}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end justify-between gap-1 py-1 pr-1">
        <EtiquetaStatus status={c.status} cat={cat} aoMudar={(s) => aoMudarStatus(c, s)} />
        {c.valor != null && <span className="text-sm font-extrabold">{dinheiro(Number(c.valor))}</span>}
      </div>
    </div>
  );
}
