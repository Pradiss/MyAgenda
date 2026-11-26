"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BarraNavegacao, { type Aba } from "./BarraNavegacao";
import Busca from "./Busca";
import Detalhe from "./Detalhe";
import FaixaSemana from "./FaixaSemana";
import Formulario from "./Formulario";
import Inicio from "./Inicio";
import Perfil from "./Perfil";
import Relatorio from "./Relatorio";
import VisaoDia from "./VisaoDia";
import VisaoMes from "./VisaoMes";
import VisaoProximos from "./VisaoProximos";
import { api, consulta, definirTokenInicial } from "@/lib/api";
import { agendaDoUsuario, categoriaDe, estiloCategoria, type CategoriaId } from "@/lib/categorias";
import { aReceber, doDia } from "@/lib/compromissos";
import { dinheiro, emSP, formatar, gradeDoMes, hoje, inicioDoDia, isoDoDia, paraISO, rotuloDia, somarDias, somarMeses, type Dia } from "@/lib/datas";
import type { Compromisso, Membro, Rascunho, Status } from "@/lib/tipos";

type Modo = "dia" | "mes";

/** Período do calendário do mês (6 semanas) que contém o dia. */
const periodoDe = (d: Dia) => {
  const g = gradeDoMes(d);
  return { de: g[0], ate: somarDias(g[41], 1) };
};

export default function AgendaApp({
  categoria,
  ramos = [],
  email,
  token,
}: {
  categoria: CategoriaId;
  /** Ramos escolhidos (Estética). Define quais serviços aparecem ao marcar. */
  ramos?: string[];
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
  const [modo, setModo] = useState<Modo>("dia");
  const [dia, setDia] = useState<Dia>(hoje);
  const [periodo, setPeriodo] = useState<Compromisso[]>([]); // calendário do mês do dia escolhido
  const [mesAtual, setMesAtual] = useState<Compromisso[]>([]); // calendário do mês de hoje (painel)
  const [proximos, setProximos] = useState<Compromisso[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");

  const [detalhe, setDetalhe] = useState<Compromisso | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [relatorio, setRelatorio] = useState(false);

  // ─── Dados ──────────────────────────────────────────────────────────────

  const { de, ate } = periodoDe(dia);
  const pedido = useRef(0);

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
      setPeriodo(p);
      setMesAtual(m ?? p);
      setProximos(prox);
      setErro("");
    } catch (e) {
      if (meu === pedido.current) setErro(`Não deu para carregar: ${(e as Error).message}`);
    }
    if (meu === pedido.current) setCarregado(true);
  }, [categoria, de, ate]);

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

  function emTodas(fn: (l: Compromisso[]) => Compromisso[]) {
    setPeriodo(fn);
    setMesAtual(fn);
    setProximos(fn);
  }

  async function mudarStatus(c: Compromisso, status: Status) {
    pedido.current++; // descarta um carregamento antigo que chegaria depois
    emTodas((l) => l.map((x) => (x.id === c.id ? { ...x, status } : x)));
    setDetalhe((d) => (d?.id === c.id ? { ...d, status } : d));
    try {
      await api(`/compromissos/${c.id}`, { metodo: "PATCH", corpo: { status } });
    } catch (e) {
      setErro(`Não deu para mudar o status: ${(e as Error).message}`);
    }
    carregar();
  }

  async function mudarEquipe(c: Compromisso, equipe: Membro[]) {
    pedido.current++;
    emTodas((l) => l.map((x) => (x.id === c.id ? { ...x, equipe } : x)));
    setDetalhe((d) => (d?.id === c.id ? { ...d, equipe } : d));
    try {
      await api(`/compromissos/${c.id}`, { metodo: "PATCH", corpo: { equipe } });
    } catch (e) {
      setErro(`Não deu para salvar a equipe: ${(e as Error).message}`);
    }
    carregar();
  }

  async function excluir(c: Compromisso, modoExclusao: "este" | "proximos") {
    const sai = (x: Compromisso) =>
      x.id === c.id ||
      (modoExclusao === "proximos" && c.serie_id != null && x.serie_id === c.serie_id && Date.parse(x.inicio) >= Date.parse(c.inicio));
    pedido.current++;
    setDetalhe(null);
    emTodas((l) => l.filter((x) => !sai(x)));
    try {
      await api(`/compromissos/${c.id}${modoExclusao === "proximos" ? "?serie=proximos" : ""}`, { metodo: "DELETE" });
    } catch (e) {
      setErro(`Não deu para excluir: ${(e as Error).message}`);
    }
    carregar();
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
    });
  }

  function duplicar(c: Compromisso) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, user_id, serie_id, criado_em, atualizado_em, ...resto } = c;
    setDetalhe(null);
    setRascunho({ ...resto, status: "marcado", equipe: resto.equipe?.map((m) => ({ ...m, pago: false })) ?? null });
  }

  function mudarAba(a: Aba) {
    setAba(a);
    window.scrollTo({ top: 0 });
  }

  // Deslizar para os lados troca de dia (ou de mês) na aba Agenda.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const aoTocar = (e: React.TouchEvent) => (toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const aoSoltar = (e: React.TouchEvent) => {
    if (!toque.current || aba !== "agenda") return;
    const dx = e.changedTouches[0].clientX - toque.current.x;
    const dy = e.changedTouches[0].clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const n = dx < 0 ? 1 : -1;
      setDia((d) => (modo === "mes" ? somarMeses(d, n) : somarDias(d, n)));
    }
  };

  const botaoRedondo = "grid size-10 place-items-center rounded-full border border-linha bg-superficie text-suave transition hover:text-tinta";

  // ─── Tela ───────────────────────────────────────────────────────────────

  return (
    <div style={estiloCategoria(cat)} className="brilho min-h-dvh">
      <div className="mx-auto max-w-xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-28" onTouchStart={aoTocar} onTouchEnd={aoSoltar}>
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
              aoAbrir={setDetalhe}
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
                    {modo === "dia" ? formatar(inicioDoDia(dia), "d 'de' MMMM 'de' yyyy") : `${dia.slice(0, 4)} · toque num dia`}
                  </p>
                  <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight first-letter:uppercase">
                    {modo === "dia" ? rotuloDia(dia, "EEEE") : formatar(inicioDoDia(dia), "MMMM")}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {modo === "mes" && (
                    <>
                      <button onClick={() => setDia(somarMeses(dia, -1))} aria-label="Mês anterior" className={botaoRedondo}>
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => setDia(somarMeses(dia, 1))} aria-label="Próximo mês" className={botaoRedondo}>
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
                <div className="grid flex-1 grid-cols-2 rounded-full border border-linha bg-superficie p-0.5">
                  {(["dia", "mes"] as Modo[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setModo(m)}
                      className={`rounded-full py-1.5 text-sm font-extrabold transition ${modo === m ? "bg-tinta text-white" : "text-suave hover:text-tinta"}`}
                    >
                      {m === "dia" ? "Dia" : "Mês"}
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
                  <VisaoDia dia={dia} cat={cat} compromissos={periodo} aoAbrir={setDetalhe} aoNovo={novo} aoMudarStatus={mudarStatus} />
                </>
              )}

              {modo === "mes" && (
                <VisaoMes dia={dia} cat={cat} compromissos={periodo} aoEscolher={setDia} aoAbrir={setDetalhe} aoNovo={novo} aoMudarStatus={mudarStatus} />
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
              <VisaoProximos cat={cat} compromissos={proximos} aoAbrir={setDetalhe} aoMudarStatus={mudarStatus} />
            </div>
          )}

          {aba === "perfil" && (
            <div className="flex flex-col gap-5">
              <header className="entrar">
                <p className="text-xs font-semibold text-suave">conta e preferências</p>
                <h1 className="text-2xl leading-tight font-extrabold tracking-tight">Perfil</h1>
              </header>
              <Perfil cat={cat} email={email} ramos={ramos} />
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
            setDetalhe(c);
          }}
          aoMudarStatus={mudarStatus}
        />
      )}

      {relatorio && <Relatorio cat={cat} diaInicial={hoje()} aoFechar={() => setRelatorio(false)} />}

      {rascunho && (
        <Formulario
          cat={cat}
          inicial={rascunho}
          aoFechar={() => setRascunho(null)}
          aoSalvar={() => {
            setRascunho(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}
