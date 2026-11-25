"use client";

import { Plus } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import Cartao from "./Cartao";
import type { Categoria } from "@/lib/categorias";
import { doDia } from "@/lib/compromissos";
import { hoje, hora, type Dia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

/** Lista do dia. Se for hoje, uma linha mostra "agora" entre o que passou e o que vem. */
export default function VisaoDia({
  dia,
  cat,
  compromissos,
  aoAbrir,
  aoNovo,
  aoMudarStatus,
}: {
  dia: Dia;
  cat: Categoria;
  compromissos: Compromisso[];
  aoAbrir: (c: Compromisso) => void;
  aoNovo: () => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
}) {
  const [agora, setAgora] = useState<string | null>(null);
  useEffect(() => {
    const atualizar = () => setAgora(new Date().toISOString());
    atualizar();
    const t = setInterval(atualizar, 60_000);
    return () => clearInterval(t);
  }, []);

  const lista = doDia(compromissos, dia);
  const ehHoje = dia === hoje() && agora != null;
  const agoraMs = agora ? Date.parse(agora) : 0;
  const passou = (c: Compromisso) => ehHoje && !c.dia_inteiro && Date.parse(c.fim) <= agoraMs;
  const indiceAgora = ehHoje ? lista.findIndex((c) => !c.dia_inteiro && Date.parse(c.fim) > agoraMs) : -1;
  const linhaNoFim = ehHoje && indiceAgora === -1 && lista.some((c) => !c.dia_inteiro);

  if (lista.length === 0) {
    return (
      <button
        onClick={aoNovo}
        className="entrar flex w-full flex-col items-center gap-3 rounded-[2rem] border border-dashed border-linha bg-superficie/60 py-12 text-suave transition hover:border-tinta/30"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-superficie-2 text-3xl">{cat.emoji}</span>
        <span className="text-lg font-extrabold text-tinta">Dia livre</span>
        <span className="flex items-center gap-1 font-semibold">
          <Plus size={16} /> Toque para marcar algo
        </span>
      </button>
    );
  }

  const LinhaAgora = () => (
    <div className="flex items-center gap-2 py-1 text-xs font-extrabold text-coral">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-coral" />
      </span>
      AGORA · {hora(agora!)}
      <span className="h-px flex-1 bg-coral/60" />
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {lista.map((c, i) => (
        <Fragment key={c.id}>
          {i === indiceAgora && <LinhaAgora />}
          <div className="entrar" style={{ animationDelay: `${i * 40}ms` }}>
            <Cartao c={c} cat={cat} aoAbrir={aoAbrir} aoMudarStatus={aoMudarStatus} passou={passou(c)} />
          </div>
        </Fragment>
      ))}
      {linhaNoFim && <LinhaAgora />}
    </div>
  );
}
