"use client";

import { useState } from "react";
import Folha from "./Folha";
import { ESTILO_STATUS } from "./Cartao";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { estiloCor } from "@/lib/cores";
import { faixaHorario, linkWhatsApp } from "@/lib/compromissos";
import { diaDe, dinheiro, rotuloDia } from "@/lib/datas";
import { baixarICS, linkGoogleAgenda } from "@/lib/lembrete";
import { ROTULO_STATUS, type Compromisso, type Status } from "@/lib/tipos";

const link = "underline decoration-lima decoration-[3px] underline-offset-2";

export default function Detalhe({
  c,
  cat,
  aoFechar,
  aoMudarStatus,
  aoEditar,
  aoDuplicar,
  aoExcluir,
}: {
  c: Compromisso;
  cat: Categoria;
  aoFechar: () => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
  aoEditar: (c: Compromisso) => void;
  aoDuplicar: (c: Compromisso) => void;
  aoExcluir: (c: Compromisso, modo: "este" | "proximos") => void;
}) {
  const [perguntando, setPerguntando] = useState(false);
  const tipo = tipoDe(cat, c.tipo);
  const whats = linkWhatsApp(c, cat);

  const linhas: [string, React.ReactNode][] = [];
  if (c.cliente) linhas.push([cat.cliente ?? "Contato", c.cliente]);
  if (c.telefone) linhas.push(["Telefone", <a key="t" href={`tel:${c.telefone}`} className={link}>{c.telefone}</a>]);
  if (c.local) {
    const ehLink = /^https?:\/\//.test(c.local);
    const href = ehLink ? c.local : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.local)}`;
    linhas.push([cat.local ?? "Local", <a key="l" target="_blank" rel="noreferrer" href={href} className={`${link} break-all`}>{c.local}</a>]);
  }
  if (c.valor != null) linhas.push([cat.valor?.replace(" (R$)", "") ?? "Valor", dinheiro(Number(c.valor))]);
  if (c.observacao) linhas.push(["Obs.", <span key="o" className="whitespace-pre-wrap">{c.observacao}</span>]);

  return (
    <Folha titulo={c.titulo} aoFechar={aoFechar} estilo={estiloCor(tipo.cor)}>
      <div className="flex flex-col gap-4 pt-1">
        <div className="rounded-3xl bg-tinta p-5 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold">
            <span className="size-2 rounded-full bg-(--c)" />
            {tipo.nome}
          </span>
          <p className="mt-2 text-lg font-extrabold">{rotuloDia(diaDe(c.inicio))}</p>
          <p className="text-lg font-extrabold">{faixaHorario(c)}</p>
          {c.serie_id && <p className="mt-1 text-sm font-bold opacity-80">🔁 Faz parte de uma repetição</p>}
        </div>

        {linhas.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {linhas.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-extrabold text-suave">{k}</dt>
                <dd className="min-w-0 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className={`grid gap-2 ${cat.status.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          {cat.status.map((s) => (
            <button
              key={s}
              onClick={() => aoMudarStatus(c, s)}
              className={`rounded-full py-2.5 font-extrabold transition active:scale-95 ${ESTILO_STATUS[s]} ${
                c.status === s ? "ring-2 ring-current ring-offset-2 ring-offset-superficie" : "opacity-55"
              }`}
            >
              {ROTULO_STATUS[s]}
            </button>
          ))}
        </div>

        {whats && (
          <a href={whats} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#25d366] py-3.5 text-center text-lg font-extrabold text-white">
            Confirmar no WhatsApp
          </a>
        )}

        <div>
          <p className="mb-1.5 text-sm font-extrabold text-suave">🔔 Lembrete no celular</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={linkGoogleAgenda(c, cat)} target="_blank" rel="noreferrer" className="rounded-2xl border border-linha py-2.5 text-center font-extrabold">
              Google Agenda
            </a>
            <button onClick={() => baixarICS(c, cat)} className="rounded-2xl border border-linha py-2.5 font-extrabold">
              iPhone / outro
            </button>
          </div>
        </div>

        {perguntando && (
          <div className="rounded-2xl border border-coral/40 bg-coral/12 p-3">
            <p className="mb-2 font-extrabold text-coral">Excluir só este ou também os próximos?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => aoExcluir(c, "este")} className="rounded-xl bg-fundo py-2.5 font-extrabold text-coral">Só este</button>
              <button onClick={() => aoExcluir(c, "proximos")} className="rounded-xl bg-coral py-2.5 font-extrabold text-white">Este e os próximos</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => aoEditar(c)} className="rounded-2xl bg-tinta py-3 font-extrabold text-white">Editar</button>
          <button onClick={() => aoDuplicar(c)} className="rounded-2xl bg-superficie-2 py-3 font-extrabold">Duplicar</button>
          <button onClick={() => (c.serie_id ? setPerguntando(true) : confirm(`Excluir "${c.titulo}"?`) && aoExcluir(c, "este"))} className="rounded-2xl bg-coral/12 py-3 font-extrabold text-coral">
            Excluir
          </button>
        </div>
      </div>
    </Folha>
  );
}
