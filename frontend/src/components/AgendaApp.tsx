"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BarraNavegacao, { type Aba } from "./BarraNavegacao";
import Busca from "./Busca";
import Detalhe from "./Detalhe";
import FaixaSemana from "./FaixaSemana";
import Formulario, { type Envio } from "./Formulario";
import Inicio from "./Inicio";
import Perfil from "./Perfil";
import Relatorio from "./Relatorio";
import VisaoDia from "./VisaoDia";
import VisaoAno from "./VisaoAno";
import VisaoMes from "./VisaoMes";
import VisaoProximos from "./VisaoProximos";
import { api, consulta, definirTokenInicial } from "@/lib/api";
import { aplicarTemaNaPagina, estiloTema, temaDe } from "@/lib/temas";
import { agendaDoUsuario, categoriaDe, estiloCategoria, type CategoriaId } from "@/lib/categorias";
import { aReceber, doDia } from "@/lib/compromissos";
import { dinheiro, emSP, formatar, gradeDoMes, hoje, inicioDoDia, isoDoDia, paraISO, rotuloDia, somarDias, somarMeses, type Dia } from "@/lib/datas";
import type { Compromisso, Membro, Rascunho, Status } from "@/lib/tipos";

type Modo = "dia" | "mes" | "ano";
const porInicio = (a: Compromisso, b: Compromisso) => Date.parse(a.inicio) - Date.parse(b.inicio);
/** Níveis de zoom, do mais perto ao mais longe (pinça muda de um para o outro). */
const ZOOM: Modo[] = ["dia", "mes", "ano"];
const ROTULO_MODO: Record<Modo, string> = { dia: "Dia", mes: "Mês", ano: "Ano" };

/** Período do calendário do mês (6 semanas) que contém o dia. */
const periodoDe = (d: Dia) => {
  const g = gradeDoMes(d);
  return { de: g[0], ate: somarDias(g[41], 1) };
};

export default function AgendaApp({
  categoria,
  ramos = [],
  tema: temaInicial,
  email,
  token,
}: {
  categoria: CategoriaId;
  /** Ramos escolhidos (Estética). Define quais serviços aparecem ao marcar. */
  ramos?: string[];
  /** Tema de cores salvo na conta. */
  tema?: string;
  email: string;
  token?: { valor: string; expiraEm: number } | null;
}) {
  const cat = useMemo(() => agendaDoUsuario(categoriaDe(categoria)!, ramos), [categoria, ramos]);
  definirTokenInicial(token); // antes do primeiro carregamento
  const nome = useMemo(() => {
    const base = email.split("@")[0].split(/[._-]/)[0] || "você";
    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [email]);

  const [aba, setAba] = useState<Aba>("inicio");
  const [tema, setTema] = useState(() => temaDe(temaInicial));
  useEffect(() => aplicarTemaNaPagina(tema), [tema]);
  const [modo, setModo] = useState<Modo>("dia");
  const [dia, setDia] = useState<Dia>(hoje);
  const [periodo, setPeriodo] = useState<Compromisso[]>([]); // calendário do mês do dia escolhido
  const [mesAtual, setMesAtual] = useState<Compromisso[]>([]); // calendário do mês de hoje (painel)
  const [proximos, setProximos] = useState<Compromisso[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");

  const [detalhe, setDetalhe] = useState<Compromisso | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [erroForm, setErroForm] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [relatorio, setRelatorio] = useState(false);

  // ─── Dados ──────────────────────────────────────────────────────────────

  // Ano: carrega o ano todo; dia e mês: as 6 semanas do calendário do mês.
  const { de, ate } =
    modo === "ano" ? { de: `${dia.slice(0, 4)}-01-01`, ate: `${Number(dia.slice(0, 4)) + 1}-01-01` } : periodoDe(dia);
  const pedido = useRef(0);

  // Mudanças feitas aqui que o servidor ainda não confirmou (null = excluído).
  // São reaplicadas sobre qualquer recarga, para a tela nunca "voltar atrás" enquanto salva.
  const pendentes = useRef(new Map<string, Compromisso | null>());
  const aplicarPendentes = useCallback((l: Compromisso[], soFuturos = false) => {
    if (!pendentes.current.size) return l;
    const porId = new Map(l.map((c) => [c.id, c]));
    for (const [id, c] of pendentes.current) {
      if (c === null || (soFuturos && (c.status === "cancelado" || Date.parse(c.fim) <= Date.now()))) porId.delete(id);
      else porId.set(id, c);
    }
    return [...porId.values()].sort(porInicio);
  }, []);

  const carregar = useCallback(async () => {
    const meu = ++pedido.current;
    const atual = periodoDe(hoje());
    const mesmoPeriodo = atual.de === de;
    const buscar = (p: { de: Dia; ate: Dia }) =>
      api<Compromisso[]>(`/compromissos${consulta({ categoria, de: isoDoDia(p.de), ate: isoDoDia(p.ate) })}`);
    try {
      const [p, m, prox] = await Promise.all([
        buscar({ de, ate }),
        mesmoPeriodo ? null : buscar(atual),
        api<Compromisso[]>(`/compromissos/proximos${consulta({ categoria })}`),
      ]);
      if (meu !== pedido.current) return; // chegou uma resposta mais nova
      setPeriodo(aplicarPendentes(p));
      setMesAtual(aplicarPendentes(m ?? p));
      setProximos(aplicarPendentes(prox, true));
      setErro("");
    } catch (e) {
      if (meu === pedido.current) setErro(`Não deu para carregar: ${(e as Error).message}`);
    }
    if (meu === pedido.current) setCarregado(true);
  }, [categoria, de, ate, aplicarPendentes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Tempo real (direto do Supabase): mexeu no celular, aparece no computador e vice-versa.
  const carregarAtual = useRef(carregar);
  useEffect(() => {
    carregarAtual.current = carregar;
  }, [carregar]);

  const idsNaTela = useRef(new Set<string>());
  useEffect(() => {
    idsNaTela.current = new Set([...periodo, ...mesAtual, ...proximos].map((c) => c.id));
  }, [periodo, mesAtual, proximos]);

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout>;
    const agendar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => carregarAtual.current(), 150);
    };
    // Só as mudanças desta conta. Exclusões não aceitam filtro no Supabase: recarrega só
    // se o item excluído estiver na tela. O Supabase é carregado depois da primeira tela.
    type Cliente = ReturnType<typeof import("@/lib/supabase/client").criarClienteNavegador>;
    let supabase: Cliente | null = null;
    let canal: ReturnType<Cliente["channel"]> | null = null;
    let ativo = true;
    // Espera a tela assentar antes de carregar o Supabase (não disputa com a primeira pintura).
    const conectar = () => import("@/lib/supabase/client").then(async ({ criarClienteNavegador }) => {
      if (!ativo) return;
      supabase = criarClienteNavegador();
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!ativo || !uid) return;
      const filtro = `user_id=eq.${uid}`;
      canal = supabase
        .channel(`agenda-${categoria}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "compromissos", filter: filtro }, agendar)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "compromissos", filter: filtro }, agendar)
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "compromissos" }, (p) => {
          const id = (p.old as { id?: string }).id;
          if (id && idsNaTela.current.has(id)) agendar();
        })
        .subscribe();
    });
    const atraso = setTimeout(conectar, 2500);
    const aoVoltar = () => document.visibilityState === "visible" && agendar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearTimeout(espera);
      clearTimeout(atraso);
      document.removeEventListener("visibilitychange", aoVoltar);
      ativo = false;
      if (canal && supabase) supabase.removeChannel(canal);
    };
  }, [categoria]);

  // ─── Derivados ──────────────────────────────────────────────────────────

  const doDiaAtivo = doDia(periodo, dia).filter((c) => c.status !== "cancelado");
  const detalheAtual = detalhe ? [...periodo, ...mesAtual, ...proximos].find((c) => c.id === detalhe.id) ?? detalhe : null;

  // ─── Ações ──────────────────────────────────────────────────────────────

  /** Coloca (ou troca) compromissos nas listas da tela; `tirar` remove ids (ex.: os temporários). */
  function colocar(itens: Compromisso[], tirar: string[] = []) {
    const fora = new Set([...tirar, ...itens.map((c) => c.id)]);
    const agora = Date.now();
    const juntar = (l: Compromisso[], futuro = false) =>
      [...l.filter((c) => !fora.has(c.id)), ...itens.filter((c) => !futuro || (c.status !== "cancelado" && Date.parse(c.fim) > agora))].sort(porInicio);
    setPeriodo((l) => juntar(l));
    setMesAtual((l) => juntar(l));
    setProximos((l) => juntar(l, true));
    setDetalhe((d) => (d ? itens.find((c) => c.id === d.id) ?? d : d));
  }

  const temporario = (c: Compromisso) => c.id.startsWith("tmp-");
  const abrir = (c: Compromisso) => !temporario(c) && setDetalhe(c);

  /** Muda campos de um compromisso já salvo: aparece na hora, confirma em segundo plano. */
  async function atualizar(c: Compromisso, mudanca: Partial<Compromisso>, rotuloErro: string) {
    if (temporario(c)) return;
    pedido.current++; // descarta um carregamento antigo que chegaria depois
    const otimista = { ...c, ...mudanca };
    pendentes.current.set(c.id, otimista);
    colocar([otimista]);
    try {
      const salvo = await api<Compromisso>(`/compromissos/${c.id}`, { metodo: "PATCH", corpo: mudanca });
      pendentes.current.delete(c.id);
      colocar([salvo]);
    } catch (e) {
      pendentes.current.delete(c.id);
      colocar([c]);
      setErro(`${rotuloErro}: ${(e as Error).message}`);
    }
  }

  const mudarStatus = (c: Compromisso, status: Status) => atualizar(c, { status }, "Não deu para mudar o status");
  const mudarEquipe = (c: Compromisso, equipe: Membro[]) => atualizar(c, { equipe }, "Não deu para salvar a equipe");

  async function excluir(c: Compromisso, modoExclusao: "este" | "proximos") {
    const sai = (x: Compromisso) =>
      x.id === c.id ||
      (modoExclusao === "proximos" && c.serie_id != null && x.serie_id === c.serie_id && Date.parse(x.inicio) >= Date.parse(c.inicio));
    const saindo = [...periodo, ...mesAtual, ...proximos].filter(sai).map((x) => x.id);
    pedido.current++;
    setDetalhe(null);
    saindo.forEach((id) => pendentes.current.set(id, null));
    colocar([], saindo);
    try {
      await api(`/compromissos/${c.id}${modoExclusao === "proximos" ? "?serie=proximos" : ""}`, { metodo: "DELETE" });
      saindo.forEach((id) => pendentes.current.delete(id));
    } catch (e) {
      saindo.forEach((id) => pendentes.current.delete(id));
      setErro(`Não deu para excluir: ${(e as Error).message}`);
      carregar();
    }
  }

  /**
   * Salvar sem esperar: o formulário fecha e o compromisso aparece na hora ("salvando…").
   * Se o servidor recusar, ele some e o formulário volta aberto com tudo preenchido.
   */
  async function salvarEnvio(envio: Envio) {
    const deVolta: Rascunho = { ...envio.dados, id: envio.id };
    setRascunho(null);
    pedido.current++;

    if (envio.id) {
      const anterior = [...periodo, ...mesAtual, ...proximos].find((c) => c.id === envio.id);
      if (!anterior) return;
      const otimista = { ...anterior, ...envio.dados } as Compromisso;
      pendentes.current.set(anterior.id, otimista);
      colocar([otimista]);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categoria: _c, ...edicao } = envio.dados;
        const salvo = await api<Compromisso>(`/compromissos/${anterior.id}`, { metodo: "PATCH", corpo: edicao });
        pendentes.current.delete(anterior.id);
        colocar([salvo]);
      } catch (e) {
        pendentes.current.delete(anterior.id);
        colocar([anterior]);
        setErroForm(`Não salvou: ${(e as Error).message}. Tente de novo.`);
        setRascunho(deVolta);
      }
      return;
    }

    const agoraIso = new Date().toISOString();
    const vezes = envio.ocorrencias ?? [{ inicio: envio.dados.inicio, fim: envio.dados.fim }];
    const temporarios = vezes.map(
      (o, i) =>
        ({ ...envio.dados, ...o, id: `tmp-${Date.now()}-${i}`, user_id: "", serie_id: envio.ocorrencias ? "tmp" : null, criado_em: agoraIso, atualizado_em: agoraIso }) as Compromisso,
    );
    const idsTemp = temporarios.map((t) => t.id);
    temporarios.forEach((t) => pendentes.current.set(t.id, t));
    colocar(temporarios);
    try {
      const corpo = envio.ocorrencias ? { ...envio.dados, ocorrencias: envio.ocorrencias } : envio.dados;
      const resposta = await api<Compromisso | Compromisso[]>("/compromissos", { metodo: "POST", corpo });
      idsTemp.forEach((id) => pendentes.current.delete(id));
      colocar(Array.isArray(resposta) ? resposta : [resposta], idsTemp);
    } catch (e) {
      idsTemp.forEach((id) => pendentes.current.delete(id));
      colocar([], idsTemp);
      setErroForm(`Não salvou: ${(e as Error).message}. Tente de novo.`);
      setRascunho(deVolta);
    }
  }

  function novo() {
    const d = aba === "agenda" ? dia : hoje();
    const horaInicial = d === hoje() ? `${String(Math.min(emSP(Date.now()).getHours() + 1, 23)).padStart(2, "0")}:00` : "09:00";
    const inicio = paraISO(d, horaInicial);
    setRascunho({
      categoria,
      tipo: cat.tipos[0].id,
      titulo: "",
      inicio,
      fim: new Date(Date.parse(inicio) + (cat.tipos[0].duracao ?? 60) * 60_000).toISOString(),
      dia_inteiro: false,
      cliente: null,
      telefone: null,
      local: null,
      valor: null,
      status: "marcado",
      observacao: null,
      equipe: null,
      servicos: [],
    });
  }

  function duplicar(c: Compromisso) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, user_id, serie_id, criado_em, atualizado_em, ...resto } = c;
    setDetalhe(null);
    setRascunho({ ...resto, status: "marcado", equipe: resto.equipe?.map((m) => ({ ...m, pago: false })) ?? null });
  }

  // iOS Safari ignora touch-action para pinça; bloqueia o "gesture" dele só na aba Agenda.
  useEffect(() => {
    if (aba !== "agenda") return;
    const bloquear = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", bloquear);
    document.addEventListener("gesturechange", bloquear);
    return () => {
      document.removeEventListener("gesturestart", bloquear);
      document.removeEventListener("gesturechange", bloquear);
    };
  }, [aba]);

  function mudarAba(a: Aba) {
    setAba(a);
    window.scrollTo({ top: 0 });
  }

  // Na aba Agenda:
  // - deslizar para os lados troca de dia / mês / ano;
  // - pinça (dois dedos) muda o zoom como no iPhone: juntar = afastar (dia → mês → ano), abrir = aproximar.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const pinca = useRef<{ inicio: number; atual: number } | null>(null);
  const distancia = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  function zoom(direcao: 1 | -1) {
    const i = ZOOM.indexOf(modo) + direcao;
    if (i >= 0 && i < ZOOM.length) setModo(ZOOM[i]);
  }

  const aoTocar = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = distancia(e.touches);
      pinca.current = { inicio: d, atual: d };
      toque.current = null;
      return;
    }
    if (!pinca.current) toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const aoMover = (e: React.TouchEvent) => {
    if (pinca.current && e.touches.length === 2) pinca.current.atual = distancia(e.touches);
  };
  const aoSoltar = (e: React.TouchEvent) => {
    if (pinca.current) {
      if (e.touches.length > 0) return; // ainda tem dedo na tela
      const razao = pinca.current.atual / pinca.current.inicio;
      pinca.current = null;
      if (aba === "agenda" && razao < 0.8) zoom(1);
      if (aba === "agenda" && razao > 1.25) zoom(-1);
      return;
    }
    if (!toque.current || aba !== "agenda") return;
    const dx = e.changedTouches[0].clientX - toque.current.x;
    const dy = e.changedTouches[0].clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const n = dx < 0 ? 1 : -1;
      setDia((d) => (modo === "ano" ? somarMeses(d, 12 * n) : modo === "mes" ? somarMeses(d, n) : somarDias(d, n)));
    }
  };

  const botaoRedondo = "grid size-10 place-items-center rounded-full border border-linha bg-superficie text-suave transition hover:text-tinta";

  // ─── Tela ───────────────────────────────────────────────────────────────

  return (
    <div style={{ ...estiloCategoria(cat), ...estiloTema(tema) }} className="brilho min-h-dvh">
      <div
        className="mx-auto max-w-xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-28"
        // Na agenda, a pinça é do app (zoom dia/mês/ano), não do navegador.
        style={aba === "agenda" ? { touchAction: "pan-x pan-y" } : undefined}
        onTouchStart={aoTocar}
        onTouchMove={aoMover}
        onTouchEnd={aoSoltar}
      >
        {erro && (
          <button
            onClick={() => {
              setErro("");
              carregar();
            }}
            className="mb-3 w-full rounded-2xl bg-coral/12 px-4 py-3 text-left text-sm font-bold text-coral"
          >
            {erro} <span className="underline">Tocar para tentar de novo</span>
          </button>
        )}

        <div className={carregado ? "" : "animate-pulse"}>
          {aba === "inicio" && (
            <Inicio
              cat={cat}
              nome={nome}
              mesAtual={mesAtual}
              proximos={proximos}
              carregado={carregado}
              aoAbrir={abrir}
              aoNovo={novo}
              aoMudarStatus={mudarStatus}
              aoBuscar={() => setBuscando(true)}
              aoRelatorio={() => setRelatorio(true)}
            />
          )}

          {aba === "agenda" && (
            <div className="flex flex-col gap-3">
              <header className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-suave first-letter:uppercase">
                    {modo === "dia"
                      ? formatar(inicioDoDia(dia), "d 'de' MMMM 'de' yyyy")
                      : modo === "mes"
                        ? `${dia.slice(0, 4)} · junte os dedos para ver o ano`
                        : "toque num mês para abrir"}
                  </p>
                  <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight first-letter:uppercase">
                    {modo === "dia" ? rotuloDia(dia, "EEEE") : modo === "mes" ? formatar(inicioDoDia(dia), "MMMM") : dia.slice(0, 4)}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {modo !== "dia" && (
                    <>
                      <button onClick={() => setDia(somarMeses(dia, modo === "ano" ? -12 : -1))} aria-label="Anterior" className={botaoRedondo}>
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => setDia(somarMeses(dia, modo === "ano" ? 12 : 1))} aria-label="Próximo" className={botaoRedondo}>
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  <button onClick={() => setBuscando(true)} aria-label="Buscar" className={botaoRedondo}>
                    <Search size={18} />
                  </button>
                </div>
              </header>

              <div className="entrar flex items-center gap-2" style={{ animationDelay: "40ms" }}>
                <div className="grid flex-1 grid-cols-3 rounded-full border border-linha bg-superficie p-0.5">
                  {ZOOM.map((m) => (
                    <button
                      key={m}
                      onClick={() => setModo(m)}
                      className={`rounded-full py-1.5 text-sm font-extrabold transition ${modo === m ? "bg-tinta text-white" : "text-suave hover:text-tinta"}`}
                    >
                      {ROTULO_MODO[m]}
                    </button>
                  ))}
                </div>
                {dia !== hoje() && (
                  <button onClick={() => setDia(hoje())} className="h-9 rounded-full bg-lima px-4 text-sm font-extrabold text-escuro">
                    Hoje
                  </button>
                )}
              </div>

              {modo === "dia" && (
                <>
                  <div className="entrar" style={{ animationDelay: "80ms" }}>
                    <FaixaSemana dia={dia} cat={cat} compromissos={periodo} aoEscolher={setDia} />
                  </div>
                  {doDiaAtivo.length > 0 && (
                    <div className="flex items-center justify-between px-1 text-xs">
                      <span className="font-bold">
                        {doDiaAtivo.length} {doDiaAtivo.length > 1 ? "compromissos" : "compromisso"}
                      </span>
                      {cat.valor ? (
                        <span className="font-bold text-suave">
                          a receber <span className="text-tinta">{dinheiro(aReceber(doDiaAtivo))}</span>
                        </span>
                      ) : (
                        <span className="font-bold text-suave">
                          <span className="text-tinta">{doDiaAtivo.filter((c) => c.status === "feito").length}</span> feitos
                        </span>
                      )}
                    </div>
                  )}
                  <VisaoDia dia={dia} cat={cat} compromissos={periodo} aoAbrir={abrir} aoNovo={novo} aoMudarStatus={mudarStatus} />
                </>
              )}

              {modo === "ano" && (
                <div key="ano" className="zoom-entrar">
                  <VisaoAno
                    dia={dia}
                    compromissos={periodo}
                    aoEscolherMes={(d) => {
                      setDia(d);
                      setModo("mes");
                    }}
                  />
                </div>
              )}

              {modo === "mes" && (
                <div key="mes" className="zoom-entrar">
                  <VisaoMes dia={dia} cat={cat} compromissos={periodo} aoEscolher={setDia} aoAbrir={abrir} aoNovo={novo} aoMudarStatus={mudarStatus} />
                </div>
              )}
            </div>
          )}

          {aba === "lista" && (
            <div className="flex flex-col gap-5">
              <header className="entrar flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-suave">o que vem pela frente</p>
                  <h1 className="text-2xl leading-tight font-extrabold tracking-tight">Próximos</h1>
                </div>
                <button onClick={() => setBuscando(true)} aria-label="Buscar" className={botaoRedondo}>
                  <Search size={18} />
                </button>
              </header>
              <VisaoProximos cat={cat} compromissos={proximos} aoAbrir={abrir} aoMudarStatus={mudarStatus} />
            </div>
          )}

          {aba === "perfil" && (
            <div className="flex flex-col gap-5">
              <header className="entrar">
                <p className="text-xs font-semibold text-suave">conta e preferências</p>
                <h1 className="text-2xl leading-tight font-extrabold tracking-tight">Perfil</h1>
              </header>
              <Perfil cat={cat} email={email} ramos={ramos} tema={tema.id} aoMudarTema={(id) => setTema(temaDe(id))} />
            </div>
          )}
        </div>
      </div>

      <BarraNavegacao aba={aba} aoMudar={mudarAba} aoNovo={novo} />

      {detalheAtual && (
        <Detalhe
          c={detalheAtual}
          cat={cat}
          aoFechar={() => setDetalhe(null)}
          aoMudarStatus={mudarStatus}
          aoEditar={(c) => {
            setDetalhe(null);
            setRascunho(c);
          }}
          aoDuplicar={duplicar}
          aoExcluir={excluir}
          aoMudarEquipe={mudarEquipe}
        />
      )}

      {buscando && (
        <Busca
          cat={cat}
          aoFechar={() => setBuscando(false)}
          aoAbrir={(c) => {
            setBuscando(false);
            abrir(c);
          }}
          aoMudarStatus={mudarStatus}
        />
      )}

      {relatorio && <Relatorio cat={cat} diaInicial={hoje()} aoFechar={() => setRelatorio(false)} />}

      {rascunho && (
        <Formulario
          key={erroForm || "novo"}
          cat={cat}
          inicial={rascunho}
          erroInicial={erroForm}
          existentes={[...new Map([...periodo, ...mesAtual, ...proximos].map((c) => [c.id, c])).values()]}
          aoFechar={() => {
            setRascunho(null);
            setErroForm("");
          }}
          aoSalvar={(envio) => {
            setErroForm("");
            salvarEnvio(envio);
          }}
        />
      )}
    </div>
  );
}
