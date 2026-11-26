"use client";

import { Bell, Copy, MessageCircle, Pencil, Repeat, Trash2 } from "lucide-react";
import { useState } from "react";
import Folha from "./Folha";
import { ESTILO_STATUS } from "./Cartao";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { corDe, estiloCor } from "@/lib/cores";
import { custoEquipe, faixaHorario, linkWhatsApp, lucroDe, tiposDe } from "@/lib/compromissos";
import { diaDe, dinheiro, rotuloDia } from "@/lib/datas";
import { baixarICS, linkGoogleAgenda } from "@/lib/lembrete";
import { ROTULO_STATUS, type Compromisso, type Membro, type Status } from "@/lib/tipos";

const link = "underline decoration-lima decoration-[3px] underline-offset-2";

export default function Detalhe({
  c,
  cat,
  aoFechar,
  aoMudarStatus,
  aoEditar,
  aoDuplicar,
  aoExcluir,
  aoMudarEquipe,
}: {
  c: Compromisso;
  cat: Categoria;
  aoFechar: () => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
  aoEditar: (c: Compromisso) => void;
  aoDuplicar: (c: Compromisso) => void;
  aoExcluir: (c: Compromisso, modo: "este" | "proximos") => void;
  /** Músico: marcar quem da equipe já foi pago. */
  aoMudarEquipe?: (c: Compromisso, equipe: Membro[]) => void;
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

  const acao = "flex flex-col items-center gap-1 rounded-2xl bg-superficie-2 py-2.5 text-[11px] font-extrabold transition active:scale-95";

  return (
    <Folha titulo={c.titulo} aoFechar={aoFechar} estilo={estiloCor(tipo.cor)}>
      <div className="flex flex-col gap-3.5 pt-1">
        {/* Quando */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-tinta px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-white/70">
              {tiposDe(cat, c).map((t) => (
                <span key={t.id} className="flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ background: corDe(t.cor).forte }} />
                  {t.nome}
                </span>
              ))}
              {c.serie_id && <Repeat size={11} />}
            </p>
            <p className="truncate font-extrabold">{rotuloDia(diaDe(c.inicio))}</p>
          </div>
          <p className="shrink-0 text-lg font-extrabold">{faixaHorario(c)}</p>
        </div>

        {linhas.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-1 text-sm">
            {linhas.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-bold text-suave">{k}</dt>
                <dd className="min-w-0 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Músico: equipe a pagar */}
        {c.equipe && c.equipe.length > 0 && (
          <div className="rounded-2xl border border-linha p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-extrabold">
                {cat.equipe?.rotulo ?? "Equipe"} · {c.equipe.length}
              </span>
              <span className="text-xs font-bold text-suave">
                {c.equipe.filter((m) => m.pago).length} de {c.equipe.length} pagos
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {c.equipe.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={`min-w-0 flex-1 truncate font-bold ${m.pago ? "text-suave line-through" : ""}`}>
                    {m.nome || `${cat.equipe?.item ?? "Pessoa"} ${i + 1}`}
                  </span>
                  <span className="shrink-0 font-extrabold">{dinheiro(Number(m.valor))}</span>
                  <button
                    onClick={() => aoMudarEquipe?.(c, c.equipe!.map((x, j) => (j === i ? { ...x, pago: !x.pago } : x)))}
                    className={`w-20 shrink-0 rounded-full py-1 text-[11px] font-extrabold transition active:scale-95 ${
                      m.pago ? "bg-lima text-escuro" : "bg-superficie-2 text-suave"
                    }`}
                  >
                    {m.pago ? "✓ Pago" : "A pagar"}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-linha pt-2 text-center">
              <div>
                <p className="text-[11px] font-bold text-suave">Cachê</p>
                <p className="text-sm font-extrabold">{dinheiro(Number(c.valor ?? 0))}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-suave">Equipe</p>
                <p className="text-sm font-extrabold text-coral">− {dinheiro(custoEquipe(c))}</p>
              </div>
              <div className="rounded-xl bg-lima py-0.5">
                <p className="text-[11px] font-bold text-escuro/60">Seu lucro</p>
                <p className="text-sm font-extrabold text-escuro">{dinheiro(lucroDe(c))}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status: um toque */}
        <div className={`grid gap-1.5 ${cat.status.length > 3 ? "grid-cols-4" : "grid-cols-3"}`}>
          {cat.status.map((s) => (
            <button
              key={s}
              onClick={() => aoMudarStatus(c, s)}
              className={`truncate rounded-full px-0.5 py-2 text-[11px] font-extrabold transition active:scale-95 ${ESTILO_STATUS[s]} ${
                c.status === s ? "ring-2 ring-current ring-offset-2 ring-offset-superficie" : "opacity-55"
              }`}
            >
              {ROTULO_STATUS[s]}
            </button>
          ))}
        </div>

        {/* Ações rápidas: ícones lado a lado */}
        <div className={`grid gap-2 ${whats ? "grid-cols-3" : "grid-cols-2"}`}>
          {whats && (
            <a href={whats} target="_blank" rel="noreferrer" className={`${acao} bg-[#25d366]! text-white`}>
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
          <a href={linkGoogleAgenda(c, cat)} target="_blank" rel="noreferrer" className={acao}>
            <Bell size={18} /> Google Agenda
          </a>
          <button onClick={() => baixarICS(c, cat)} className={acao}>
            <Bell size={18} /> Lembrete iPhone
          </button>
        </div>

        {perguntando && (
          <div className="rounded-2xl border border-coral/40 bg-coral/12 p-3">
            <p className="mb-2 text-sm font-extrabold text-coral">Excluir só este ou também os próximos?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => aoExcluir(c, "este")} className="rounded-xl bg-fundo py-2.5 text-sm font-extrabold text-coral">Só este</button>
              <button onClick={() => aoExcluir(c, "proximos")} className="rounded-xl bg-coral py-2.5 text-sm font-extrabold text-white">Este e os próximos</button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => aoEditar(c)} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-tinta py-3 font-extrabold text-white">
            <Pencil size={16} /> Editar
          </button>
          <button onClick={() => aoDuplicar(c)} aria-label="Duplicar" title="Duplicar" className="grid w-12 place-items-center rounded-2xl bg-superficie-2">
            <Copy size={18} />
          </button>
          <button
            onClick={() => (c.serie_id ? setPerguntando(true) : confirm(`Excluir "${c.titulo}"?`) && aoExcluir(c, "este"))}
            aria-label="Excluir"
            title="Excluir"
            className="grid w-12 place-items-center rounded-2xl bg-coral/12 text-coral"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </Folha>
  );
}
