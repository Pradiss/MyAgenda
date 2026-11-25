"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import Cartao from "./Cartao";
import { tipoDe, type Categoria } from "@/lib/categorias";
import { corDe } from "@/lib/cores";
import { doDia, faixaHorario, linkWhatsApp } from "@/lib/compromissos";
import { diaDe, diasDaSemana, dinheiro, formatar, hoje, inicioDoDia, rotuloDia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

const soma = (l: Compromisso[]) => l.reduce((t, c) => t + Number(c.valor ?? 0), 0);
const concluido = (c: Compromisso) => c.status === "pago" || c.status === "feito";

/** "em 2h 15min", "em 3 dias", "agora". */
function contagem(c: Compromisso, agora: number): string {
  const ini = Date.parse(c.inicio);
  if (ini <= agora) return "acontecendo agora";
  const min = Math.round((ini - agora) / 60_000);
  if (min < 60) return `em ${min} min`;
  if (min < 24 * 60) return `em ${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ""}`;
  const dias = Math.round(min / (24 * 60));
  return dias === 1 ? "amanhã" : `em ${dias} dias`;
}

/** Tela inicial: painel com o mês, o próximo compromisso, números da semana e o dia de hoje. */
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
  aoAgenda,
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
  aoAgenda: () => void;
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
  const semana = diasDaSemana(h).map((d) => ({ d, n: doDia(mesAtual, d).filter((c) => c.status !== "cancelado").length }));
  const totalSemana = semana.reduce((t, s) => t + s.n, 0);
  const maiorDia = Math.max(1, ...semana.map((s) => s.n));

  const proximo = agora ? proximos.find((c) => Date.parse(c.fim) > agora && !c.dia_inteiro) : undefined;
  const tipoProximo = proximo ? tipoDe(cat, proximo.tipo) : null;
  const whats = proximo ? linkWhatsApp(proximo, cat) : null;

  const confirmados = proximos.filter((c) => c.status !== "marcado").length;
  const comValor = ativosMes.filter((c) => c.valor != null);

  const numeros = cat.valor
    ? [
        { rotulo: "Hoje", valor: String(deHoje.length), detalhe: deHoje.length === 1 ? "compromisso" : "compromissos" },
        { rotulo: "Esta semana", valor: String(totalSemana), detalhe: "marcados" },
        {
          rotulo: "Confirmados",
          valor: proximos.length ? `${Math.round((confirmados / proximos.length) * 100)}%` : "—",
          detalhe: "dos próximos",
        },
        { rotulo: "Ticket médio", valor: comValor.length ? dinheiro(soma(comValor) / comValor.length) : "—", detalhe: `em ${nomeMes}` },
      ]
    : [
        { rotulo: "Hoje", valor: String(deHoje.length), detalhe: deHoje.length === 1 ? "compromisso" : "compromissos" },
        { rotulo: "Esta semana", valor: String(totalSemana), detalhe: "marcados" },
        { rotulo: "Pendentes", valor: String(pendentes.length), detalhe: `em ${nomeMes}` },
        {
          rotulo: "Prazos",
          valor: String(proximos.filter((c) => c.tipo === "prazo").length),
          detalhe: "pela frente",
        },
      ];

  const acoes = [
    { rotulo: "Marcar", icone: Plus, destaque: true, acao: aoNovo },
    { rotulo: "Buscar", icone: Search, destaque: false, acao: aoBuscar },
    { rotulo: "Resumo", icone: ChartColumn, destaque: false, acao: aoRelatorio },
    { rotulo: "Agenda", icone: CalendarDays, destaque: false, acao: aoAgenda },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Saudação */}
      <header className="entrar flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-suave first-letter:uppercase">{formatar(inicioDoDia(h), "EEEE, d 'de' MMMM")}</p>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Olá, {nome} 👋</h1>
        </div>
        <span className="grid size-12 place-items-center rounded-2xl border border-linha bg-superficie text-2xl">{cat.emoji}</span>
      </header>

      {/* Cartão principal */}
      <section
        className="entrar relative overflow-hidden rounded-[2rem] bg-tinta p-6 text-white shadow-xl shadow-black/15"
        style={{ animationDelay: "60ms" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-lima/20 blur-3xl" />
                <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white/60">
              {cat.valor ? `A receber em ${nomeMes}` : `Concluídos em ${nomeMes}`}
            </p>
            <span className="flex items-center gap-1 rounded-full bg-lima px-2.5 py-1 text-xs font-extrabold text-escuro">
              <TrendingUp size={13} /> {ativosMes.length} no mês
            </span>
          </div>
          <p className="mt-1 text-[40px] leading-none font-extrabold tracking-tighter">
            {cat.valor ? dinheiro(aReceber) : `${feitos.length} de ${ativosMes.length}`}
          </p>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-lima transition-all duration-700" style={{ width: `${Math.round(progresso * 100)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold">
            <span className="text-white/60">{cat.valor ? `Recebido ${dinheiro(recebido)}` : `${pendentes.length} pendentes`}</span>
            <span>{Math.round(progresso * 100)}%</span>
          </div>
        </div>
      </section>

      {/* Ações rápidas */}
      <section className="entrar grid grid-cols-4 gap-2" style={{ animationDelay: "120ms" }}>
        {acoes.map(({ rotulo, icone: Icone, destaque, acao }) => (
          <button key={rotulo} onClick={acao} className="group flex flex-col items-center gap-2 rounded-3xl border border-linha bg-superficie py-3.5 transition hover:border-tinta/20 active:scale-95">
            <span className={`grid size-11 place-items-center rounded-2xl transition group-hover:scale-105 ${destaque ? "bg-lima text-escuro" : "bg-superficie-2 text-tinta"}`}>
              <Icone size={20} strokeWidth={2.4} />
            </span>
            <span className="text-xs font-bold text-suave">{rotulo}</span>
          </button>
        ))}
      </section>

      {/* Próximo compromisso */}
      {!carregado && (
        <section aria-hidden>
          <div className="mb-2 h-6 w-24 rounded-full bg-superficie-2" />
          <div className="h-[13.5rem] animate-pulse rounded-[2rem] border border-linha bg-superficie" />
        </section>
      )}
      {carregado && !proximo && (
        <section className="flex items-center justify-between gap-3 rounded-[2rem] border border-dashed border-linha p-5">
          <div>
            <p className="font-extrabold">Nada marcado pela frente</p>
            <p className="text-sm text-suave">Que tal marcar o próximo?</p>
          </div>
          <button onClick={aoNovo} className="arco shrink-0 rounded-full px-4 py-2.5 text-sm font-extrabold text-white">
            Marcar
          </button>
        </section>
      )}
      {carregado && proximo && tipoProximo && (
        <section className="entrar" style={{ animationDelay: "180ms" }}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-extrabold">Próximo</h2>
            <span className="flex items-center gap-1 rounded-full bg-lima px-2.5 py-1 text-xs font-extrabold text-escuro">
              <Clock size={14} /> {contagem(proximo, agora)}
            </span>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => aoAbrir(proximo)}
            onKeyDown={(e) => e.key === "Enter" && aoAbrir(proximo)}
            className="relative cursor-pointer overflow-hidden rounded-[2rem] border border-linha bg-superficie p-5 transition hover:border-tinta/20 active:scale-[0.99]"
          >
            <span className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-superficie-2">
              <ArrowUpRight size={18} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-2 px-2.5 py-1 text-xs font-extrabold">
              <span className="size-2 rounded-full" style={{ background: corDe(tipoProximo.cor).forte }} />
              {tipoProximo.nome}
            </span>
            <p className="mt-3 pr-8 text-2xl leading-tight font-extrabold tracking-tight">{proximo.titulo}</p>
            <p className="mt-1 font-bold text-suave">
              {rotuloDia(diaDe(proximo.inicio))} · {faixaHorario(proximo)}
            </p>
            {(proximo.local || proximo.cliente) && (
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-suave">
                <MapPin size={14} /> {[proximo.cliente, proximo.local].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              {proximo.valor != null && (
                <span className="rounded-full bg-tinta px-3.5 py-2 text-sm font-extrabold text-white">{dinheiro(Number(proximo.valor))}</span>
              )}
              {whats && (
                <a
                  href={whats}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 rounded-full bg-superficie-2 px-3.5 py-2 text-sm font-extrabold transition hover:bg-linha"
                >
                  <MessageCircle size={15} /> Confirmar
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Números (cores intercaladas) */}
      <section className="entrar grid grid-cols-2 gap-2" style={{ animationDelay: "240ms" }}>
        {numeros.map((n, i) => {
          // Intercala: preto, branco, branco, verde-limão.
          const estilo = i === 0 ? "bg-tinta text-white" : i === 3 ? "bg-lima text-escuro" : "border border-linha bg-superficie";
          const fraco = i === 0 ? "text-white/60" : i === 3 ? "text-escuro/60" : "text-suave";
          return (
            <div key={n.rotulo} className={`rounded-3xl p-4 ${estilo}`}>
              <p className={`text-xs font-bold ${fraco}`}>{n.rotulo}</p>
              <p className="mt-1 truncate text-2xl font-extrabold tracking-tight">{n.valor}</p>
              <p className={`text-xs font-semibold ${fraco}`}>{n.detalhe}</p>
            </div>
          );
        })}
      </section>

      {/* Gráfico da semana */}
      <section className="entrar rounded-[2rem] border border-linha bg-superficie p-5" style={{ animationDelay: "300ms" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">Sua semana</h2>
          <span className="text-sm font-bold text-suave">{totalSemana} no total</span>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {semana.map(({ d, n }, i) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-suave">{n || ""}</span>
              <div
                className="barra-crescer w-full rounded-xl"
                style={{
                  height: `${Math.max(n / maiorDia, 0.06) * 72}px`,
                  background: d === h ? "#d4f55a" : n ? "#111111" : "var(--color-linha)",
                  animationDelay: `${350 + i * 50}ms`,
                                  }}
              />
              <span className={`text-[11px] font-bold uppercase ${d === h ? "text-tinta" : "text-suave"}`}>
                {formatar(inicioDoDia(d), "EEEEEE")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Hoje */}
      <section className="entrar" style={{ animationDelay: "360ms" }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="font-extrabold">Hoje</h2>
          <button onClick={aoAgenda} className="text-sm font-bold text-suave hover:text-tinta">
            Ver agenda
          </button>
        </div>
        {deHoje.length ? (
          <div className="flex flex-col gap-2">
            {deHoje.map((c) => (
              <Cartao key={c.id} c={c} cat={cat} aoAbrir={aoAbrir} aoMudarStatus={aoMudarStatus} passou={agora > 0 && !c.dia_inteiro && Date.parse(c.fim) <= agora} />
            ))}
          </div>
        ) : (
          <button onClick={aoNovo} className="flex w-full items-center justify-center gap-1.5 rounded-3xl border border-dashed border-linha py-6 font-bold text-suave transition hover:border-tinta/30">
            <Plus size={16} /> Nada para hoje. Marcar algo?
          </button>
        )}
      </section>
    </div>
  );
}
