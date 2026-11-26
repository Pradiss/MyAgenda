"use client";

import { ChartColumn, MessageCircle, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Cartao from "./Cartao";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { corDe } from "@/lib/cores";
import { doDia, linkWhatsApp, lucroDe } from "@/lib/compromissos";
import { diaDe, diasDaSemana, dinheiro, formatar, hoje, hora, inicioDoDia, rotuloDia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

const soma = (l: Compromisso[]) => l.reduce((t, c) => t + Number(c.valor ?? 0), 0);
const concluido = (c: Compromisso) => c.status === "pago" || c.status === "feito";

/** "em 2h15", "em 3 dias", "agora". */
function contagem(c: Compromisso, agora: number): string {
  const ini = Date.parse(c.inicio);
  if (ini <= agora) return "agora";
  const min = Math.round((ini - agora) / 60_000);
  if (min < 60) return `em ${min} min`;
  if (min < 24 * 60) return `em ${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;
  const dias = Math.round(min / (24 * 60));
  return dias === 1 ? "amanhã" : `em ${dias} dias`;
}

/** Tela inicial, compacta: o mês num cartão, o próximo compromisso e o dia de hoje. */
export default function Inicio({
  cat,
  nome,
  mesAtual,
  proximos,
  carregado,
  aoAbrir,
  aoNovo,
  aoMudarStatus,
  aoBuscar,
  aoRelatorio,
}: {
  cat: Categoria;
  nome: string;
  mesAtual: Compromisso[];
  proximos: Compromisso[];
  /** Enquanto false, o espaço do "Próximo" fica reservado (a tela não pula quando os dados chegam). */
  carregado: boolean;
  aoAbrir: (c: Compromisso) => void;
  aoNovo: () => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
  aoBuscar: () => void;
  aoRelatorio: () => void;
}) {
  const [agora, setAgora] = useState(0);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const h = hoje();
  const mes = h.slice(0, 7);
  const nomeMes = formatar(inicioDoDia(h), "MMMM");
  const ativosMes = mesAtual.filter((c) => diaDe(c.inicio).startsWith(mes) && c.status !== "cancelado");
  const feitos = ativosMes.filter(concluido);
  const pendentes = ativosMes.filter((c) => !concluido(c));
  const recebido = soma(feitos);
  const aReceber = soma(pendentes);
  const progresso = cat.valor
    ? recebido + aReceber > 0 ? recebido / (recebido + aReceber) : 0
    : ativosMes.length > 0 ? feitos.length / ativosMes.length : 0;

  const deHoje = doDia(mesAtual, h).filter((c) => c.status !== "cancelado");
  const naSemana = diasDaSemana(h).reduce((t, d) => t + doDia(mesAtual, d).filter((c) => c.status !== "cancelado").length, 0);
  const confirmados = proximos.filter((c) => c.status !== "marcado").length;

  const proximo = agora ? proximos.find((c) => Date.parse(c.fim) > agora && !c.dia_inteiro) : undefined;
  const tipoProximo = proximo ? tipoDe(cat, proximo.tipo) : null;
  const whats = proximo ? linkWhatsApp(proximo, cat) : null;

  const numeros = [
    { rotulo: "Hoje", valor: String(deHoje.length) },
    { rotulo: "Semana", valor: String(naSemana) },
    cat.equipe
      ? { rotulo: "Lucro no mês", valor: dinheiro(ativosMes.reduce((t, c) => t + lucroDe(c), 0)) }
      : cat.valor
        ? { rotulo: "Confirmados", valor: proximos.length ? `${Math.round((confirmados / proximos.length) * 100)}%` : "—" }
        : { rotulo: "Pendentes", valor: String(pendentes.length) },
  ];

  const botaoIcone =
    "grid size-10 place-items-center rounded-full border border-linha bg-superficie transition hover:border-tinta/25 active:scale-95";

  return (
    <div className="flex flex-col gap-4">
      {/* Saudação + atalhos */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-suave first-letter:uppercase">{formatar(inicioDoDia(h), "EEEE, d 'de' MMMM")}</p>
          <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight">Olá, {nome}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={aoBuscar} aria-label="Buscar" className={botaoIcone}>
            <Search size={18} />
          </button>
          <button onClick={aoRelatorio} aria-label="Resumo do mês" className={botaoIcone}>
            <ChartColumn size={18} />
          </button>
        </div>
      </header>

      {/* Cartão principal: o mês + três números */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-tinta p-5 text-white">
        <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-lima/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold text-white/60">{cat.valor ? `A receber em ${nomeMes}` : `Concluídos em ${nomeMes}`}</p>
          <p className="mt-0.5 text-[34px] leading-none font-extrabold tracking-tighter">
            {cat.valor ? dinheiro(aReceber) : `${feitos.length} de ${ativosMes.length}`}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-lima transition-all duration-700" style={{ width: `${Math.round(progresso * 100)}%` }} />
          </div>
          <p className="mt-1.5 flex justify-between text-xs font-bold text-white/60">
            <span>{cat.valor ? `Recebido ${dinheiro(recebido)}` : `${pendentes.length} pendentes`}</span>
            <span className="text-white">{Math.round(progresso * 100)}%</span>
          </p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-3">
            {numeros.map((n) => (
              <div key={n.rotulo} className="min-w-0 px-2 first:pl-0">
                <p className="text-[11px] font-bold text-white/60">{n.rotulo}</p>
                <p className="truncate text-lg leading-tight font-extrabold">{n.valor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Próximo compromisso: uma linha */}
      {!carregado && <div aria-hidden className="h-[4.75rem] animate-pulse rounded-3xl border border-linha bg-superficie" />}
      {carregado && proximo && tipoProximo && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => aoAbrir(proximo)}
          onKeyDown={(e) => e.key === "Enter" && aoAbrir(proximo)}
          className="flex cursor-pointer items-center gap-3 rounded-3xl border border-linha bg-superficie p-2 transition hover:border-tinta/20 active:scale-[0.99]"
        >
          <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-lima py-2.5 text-escuro">
            <span className="text-base leading-none font-extrabold">{hora(proximo.inicio)}</span>
            <span className="mt-1 text-[10px] font-extrabold uppercase">{contagem(proximo, agora)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[11px] font-bold text-suave">
              <span className="size-2 shrink-0 rounded-full" style={{ background: corDe(tipoProximo.cor).forte }} />
              Próximo · {tipoProximo.nome}
              {diaDe(proximo.inicio) !== h && ` · ${rotuloDia(diaDe(proximo.inicio), "EEE, d/MM")}`}
            </p>
            <p className="truncate text-[15px] font-extrabold tracking-tight">{proximo.titulo}</p>
            {(proximo.local || proximo.cliente) && (
              <p className="truncate text-xs text-suave">{[proximo.cliente, proximo.local].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          {whats && (
            <a
              href={whats}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Confirmar no WhatsApp"
              className="mr-1 grid size-10 shrink-0 place-items-center rounded-full bg-superficie-2 transition hover:bg-linha"
            >
              <MessageCircle size={18} />
            </a>
          )}
        </div>
      )}

      {/* Hoje */}
      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="font-extrabold">Hoje</h2>
          <span className="text-xs font-bold text-suave">
            {deHoje.length ? `${deHoje.length} ${deHoje.length > 1 ? "compromissos" : "compromisso"}` : ""}
          </span>
        </div>
        {deHoje.length ? (
          <div className="flex flex-col gap-2">
            {deHoje.map((c) => (
              <Cartao
                key={c.id}
                c={c}
                cat={cat}
                aoAbrir={aoAbrir}
                aoMudarStatus={aoMudarStatus}
                passou={agora > 0 && !c.dia_inteiro && Date.parse(c.fim) <= agora}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={aoNovo}
            className="flex w-full items-center justify-center gap-1.5 rounded-3xl border border-dashed border-linha py-5 text-sm font-bold text-suave transition hover:border-tinta/30"
          >
            <Plus size={16} /> Nada para hoje. Marcar algo?
          </button>
        )}
      </section>
    </div>
  );
}
