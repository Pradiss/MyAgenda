"use client";

import { useEffect, useState } from "react";
import Folha from "./Folha";
import { ESTILO_STATUS } from "./Cartao";
import { CATEGORIAS, ramoDoTipo, tipoDe, type Categoria, type Tipo } from "@/lib/categorias";
import { estiloCor } from "@/lib/cores";
import { faixaHorario } from "@/lib/compromissos";
import { dinheiro } from "@/lib/datas";
import { diaDe, formatar, hoje, hora, inicioDoDia, isoDoDia, paraISO, rotuloDia, somarDias, somarMeses, type Dia } from "@/lib/datas";
import { api, consulta } from "@/lib/api";
import { ROTULO_STATUS, type Compromisso, type Rascunho, type Status } from "@/lib/tipos";

type Conflito = Pick<Compromisso, "id" | "titulo" | "inicio" | "fim" | "dia_inteiro" | "categoria">;

const campo = "w-full rounded-2xl border border-linha bg-fundo px-4 py-3 outline-none focus:border-tinta";
const rotulo = "mb-1.5 block text-sm font-extrabold text-suave";
const chip = (ativo: boolean) =>
  `rounded-full border px-4 py-2 font-extrabold transition active:scale-95 ${
    ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-fundo text-suave"
  }`;

const DURACOES = [
  { rotulo: "30 min", min: 30 },
  { rotulo: "1h", min: 60 },
  { rotulo: "2h", min: 120 },
  { rotulo: "3h", min: 180 },
  { rotulo: "4h", min: 240 },
];

const REPETICOES = [
  { id: "nao", rotulo: "Não repete" },
  { id: "semana", rotulo: "Toda semana" },
  { id: "quinzena", rotulo: "A cada 2 semanas" },
  { id: "mes", rotulo: "Todo mês" },
] as const;
type Repeticao = (typeof REPETICOES)[number]["id"];

function diasDaRepeticao(dia: Dia, rep: Repeticao, vezes: number): Dia[] {
  return Array.from({ length: rep === "nao" ? 1 : vezes }, (_, i) =>
    rep === "mes" ? somarMeses(dia, i) : somarDias(dia, i * (rep === "quinzena" ? 14 : 7)),
  );
}

type Contato = { nome: string; telefone: string | null };

/** 150 -> "2h30", 45 -> "45min". */
const duracaoTexto = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m}min`);

const paraMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const deMin = (m: number) => {
  const t = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** "150,50", "1.500,00", "150.50" e "1.500" viram número. */
function textoParaValor(t: string): number | null {
  let limpo = t.trim().replace(/[R$\s]/g, "");
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, ""); // 1.500 = mil e quinhentos
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

export default function Formulario({
  cat,
  inicial,
  aoFechar,
  aoSalvar,
}: {
  cat: Categoria;
  inicial: Rascunho;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const editando = Boolean(inicial.id);
  const [tipo, setTipo] = useState(inicial.tipo);
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [dia, setDia] = useState(diaDe(inicial.inicio));
  const [diaInteiro, setDiaInteiro] = useState(inicial.dia_inteiro);
  const [horaIni, setHoraIni] = useState(inicial.dia_inteiro ? "09:00" : hora(inicial.inicio));
  const [horaFim, setHoraFim] = useState(inicial.dia_inteiro ? "10:00" : hora(inicial.fim));
  const [cliente, setCliente] = useState(inicial.cliente ?? "");
  const [telefone, setTelefone] = useState(inicial.telefone ?? "");
  const [local, setLocal] = useState(inicial.local ?? "");
  const [valor, setValor] = useState(inicial.valor == null ? "" : Number(inicial.valor).toFixed(2).replace(".", ","));
  const [status, setStatus] = useState<Status>(inicial.status);
  const [observacao, setObservacao] = useState(inicial.observacao ?? "");
  // Músico: equipe a pagar. Valores como texto enquanto digita ("150,00").
  const [equipe, setEquipe] = useState(() =>
    (inicial.equipe ?? []).map((m) => ({ nome: m.nome, valor: Number(m.valor).toFixed(2).replace(".", ","), pago: m.pago })),
  );
  const [qtdRapida, setQtdRapida] = useState("5");
  const [valorRapido, setValorRapido] = useState("");
  const [repeticao, setRepeticao] = useState<Repeticao>("nao");
  const [vezes, setVezes] = useState(4);
  const [contatos, setContatos] = useState<Contato[]>([]);

  // Pessoas já usadas nesta agenda: completa o nome e preenche o WhatsApp sozinho.
  const nomeEhTitulo = cat.id === "estetica";
  useEffect(() => {
    if (!cat.telefone && !cat.cliente) return;
    api<Contato[]>(`/contatos${consulta({ categoria: cat.id })}`).then(setContatos, () => {});
  }, [cat]);

  function preencherTelefone(nome: string) {
    const achado = contatos.find((c) => c.nome.toLocaleLowerCase("pt-BR") === nome.trim().toLocaleLowerCase("pt-BR"));
    if (achado?.telefone && !telefone) setTelefone(achado.telefone);
  }

  const [conflitos, setConflitos] = useState<Conflito[] | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const h = hoje();
  const viraODia = !diaInteiro && horaFim <= horaIni;
  const duracao = (paraMin(horaFim) - paraMin(horaIni) + 1440) % 1440 || 1440;

  // Mudou o horário: o aviso de conflito mostrado antes não vale mais.
  const mudarHorario = (fn: () => void) => {
    fn();
    setConflitos(null);
  };

  // Ao mudar o início, mantém a mesma duração.
  const mudarInicio = (novo: string) =>
    mudarHorario(() => {
      setHoraIni(novo);
      setHoraFim(deMin(paraMin(novo) + duracao));
    });

  /** Início e fim de cada vez que o compromisso acontece (repetição). */
  const ocorrenciasDe = () =>
    diasDaRepeticao(dia, repeticao, vezes).map((d) => ({
      inicio: diaInteiro ? isoDoDia(d) : paraISO(d, horaIni),
      fim: diaInteiro ? isoDoDia(somarDias(d, 1)) : paraISO(viraODia ? somarDias(d, 1) : d, horaFim),
    }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const valorNum = cat.valor ? textoParaValor(valor) : null;
    if (Number.isNaN(valorNum)) return setErro("Valor inválido. Use só números, ex.: 150,00");
    if (cat.ramos && servicos.length === 0) return setErro("Escolha pelo menos um serviço.");

    const equipeFinal = cat.equipe
      ? equipe
          .filter((m) => m.nome.trim() || m.valor.trim())
          .map((m) => ({ nome: m.nome.trim(), valor: textoParaValor(m.valor) ?? 0, pago: m.pago }))
      : [];
    if (equipeFinal.some((m) => Number.isNaN(m.valor))) return setErro("Valor de algum músico está inválido. Ex.: 200,00");

    const inicio = diaInteiro ? isoDoDia(dia) : paraISO(dia, horaIni);
    const fim = diaInteiro ? isoDoDia(somarDias(dia, 1)) : paraISO(viraODia ? somarDias(dia, 1) : dia, horaFim);

    const dados = {
      categoria: cat.id,
      tipo: cat.ramos ? servicos[0] : tipo,
      ...(cat.ramos ? { servicos } : {}),
      titulo: titulo.trim(),
      inicio,
      fim,
      dia_inteiro: diaInteiro,
      cliente: (cat.cliente && cliente.trim()) || null,
      telefone: (cat.telefone && telefone.replace(/\D/g, "")) || null,
      local: (cat.local && local.trim()) || null,
      valor: valorNum,
      status,
      observacao: observacao.trim() || null,
      equipe: equipeFinal.length ? equipeFinal : null,
    };

    setSalvando(true);
    try {
      // Aviso de conflito (em qualquer uma das suas agendas). Na segunda vez, salva mesmo assim.
      if (conflitos === null && !diaInteiro && status !== "cancelado") {
        // Com repetição, procura no período todo e confere cada uma das vezes.
        const vezesMarcadas = repeticao === "nao" || editando ? [{ inicio, fim }] : ocorrenciasDe();
        const ultima = vezesMarcadas[vezesMarcadas.length - 1];
        const encontrados = await api<Conflito[]>(
          `/compromissos/conflitos${consulta({ inicio: vezesMarcadas[0].inicio, fim: ultima.fim, ignorar: inicial.id })}`,
        );
        const bate = (c: Conflito) =>
          vezesMarcadas.some((v) => Date.parse(c.inicio) < Date.parse(v.fim) && Date.parse(c.fim) > Date.parse(v.inicio));
        const lista = encontrados.filter(bate);
        if (lista.length > 0) {
          setConflitos(lista);
          setSalvando(false);
          return;
        }
      }
      if (inicial.id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categoria, ...edicao } = dados;
        await api(`/compromissos/${inicial.id}`, { metodo: "PATCH", corpo: edicao });
      } else if (repeticao !== "nao") {
        await api("/compromissos", { metodo: "POST", corpo: { ...dados, ocorrencias: ocorrenciasDe() } });
      } else {
        await api("/compromissos", { metodo: "POST", corpo: dados });
      }
    } catch (e) {
      setSalvando(false);
      return setErro(`Não deu para salvar: ${(e as Error).message}`);
    }
    aoSalvar();
  }

  // Estética: ramo aberto na hora de escolher o serviço (o do compromisso, ou o primeiro da pessoa).
  const [ramoAtivo, setRamoAtivo] = useState(() => ramoDoTipo(cat, inicial.tipo)?.id ?? cat.ramos?.[0]?.id);
  const outro = cat.tipos.find((t) => t.id === "outro");
  const opcoes: Tipo[] = cat.ramos
    ? [...(cat.ramos.find((r) => r.id === ramoAtivo)?.servicos ?? []), ...(outro ? [outro] : [])]
    : cat.tipos;

  /** Escolher o tipo já ajusta o fim pela duração típica dele (só ao marcar, não ao editar). */
  function escolherTipo(t: Tipo) {
    setTipo(t.id);
    if (!editando && t.duracao && !diaInteiro) mudarHorario(() => setHoraFim(deMin(paraMin(horaIni) + t.duracao!)));
  }

  // Estética: vários serviços no mesmo horário (cílios + sobrancelha + unha para a mesma cliente).
  const [servicos, setServicos] = useState<string[]>(() =>
    inicial.servicos?.length ? inicial.servicos : editando ? [inicial.tipo] : [],
  );
  const escolhidos = servicos.map((id) => tipoDe(cat, id));
  const duracaoTotal = escolhidos.reduce((t, x) => t + (x.duracao ?? 0), 0);

  /** Liga/desliga um serviço; o fim passa a ser início + soma das durações. */
  function alternarServico(t: Tipo) {
    const nova = servicos.includes(t.id) ? servicos.filter((x) => x !== t.id) : [...servicos, t.id];
    setServicos(nova);
    if (nova.length) setTipo(nova[0]);
    const total = nova.reduce((soma, id) => soma + (tipoDe(cat, id).duracao ?? 0), 0);
    if (total && !diaInteiro) mudarHorario(() => setHoraFim(deMin(paraMin(horaIni) + total)));
  }

  const temDetalhes = Boolean(cliente || telefone || local || observacao);
  const [detalhes, setDetalhes] = useState(editando && temDetalhes);
  const mini = "w-full rounded-xl border border-linha bg-fundo px-3 py-2.5 font-bold outline-none focus:border-tinta";

  return (
    <Folha titulo={editando ? "Editar" : "Marcar"} aoFechar={aoFechar} estilo={estiloCor(tipoDe(cat, tipo).cor)}>
      <form onSubmit={salvar} className="flex flex-col gap-3.5 pt-1">
        {cat.ramos ? (
          <div className="flex flex-col gap-2">
            {/* Selecionados: tocar tira */}
            {escolhidos.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {escolhidos.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => alternarServico(t)}
                    style={estiloCor(t.cor)}
                    className="entrar flex items-center gap-1.5 rounded-full bg-lima py-1 pr-2 pl-2.5 text-[13px] font-extrabold text-escuro"
                  >
                    <span className="size-2 rounded-full bg-(--c)" />
                    {t.nome}
                    <span aria-label="tirar" className="text-escuro/50">×</span>
                  </button>
                ))}
                {duracaoTotal > 0 && <span className="text-xs font-bold text-suave">= {duracaoTexto(duracaoTotal)}</span>}
              </div>
            )}

            {/* Ramos da pessoa: a bolinha conta quantos já foram escolhidos */}
            {cat.ramos.length > 1 && (
              <div className="sem-barra -mx-5 flex gap-1.5 overflow-x-auto px-5">
                {cat.ramos.map((r) => {
                  const n = r.servicos.filter((x) => servicos.includes(x.id)).length;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRamoAtivo(r.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold transition ${
                        r.id === ramoAtivo ? "bg-tinta text-white" : "bg-superficie-2 text-suave hover:text-tinta"
                      }`}
                    >
                      <span aria-hidden>{r.emoji}</span>
                      {r.nome}
                      {n > 0 && <span className="grid size-5 place-items-center rounded-full bg-lima text-[11px] text-escuro">{n}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Serviços do ramo aberto: toque para marcar vários */}
            <div className="flex flex-wrap gap-1.5">
              {opcoes.map((t) => {
                const ativo = servicos.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => alternarServico(t)}
                    aria-pressed={ativo}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-extrabold transition active:scale-95 ${
                      ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-fundo text-tinta"
                    }`}
                  >
                    {ativo && <span className="text-lima">✓</span>}
                    {t.nome}
                    {t.duracao && (
                      <span className={`text-[11px] font-bold ${ativo ? "text-white/60" : "text-suave"}`}>{duracaoTexto(t.duracao)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5">
            {opcoes.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => escolherTipo(t)}
                style={estiloCor(t.cor)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-extrabold transition active:scale-95 ${
                  t.id === tipo ? "border-tinta bg-tinta text-white" : "border-linha bg-fundo text-tinta"
                }`}
              >
                <span className="size-2 rounded-full bg-(--c)" />
                {t.nome}
              </button>
            ))}
          </div>
        )}

        <input
          id="titulo"
          required
          aria-label={cat.titulo.rotulo}
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (nomeEhTitulo) preencherTelefone(e.target.value);
          }}
          placeholder={cat.titulo.exemplo}
          list={nomeEhTitulo ? "contatos" : undefined}
          autoComplete="off"
          className="w-full rounded-2xl border border-linha bg-fundo px-4 py-3 text-lg font-extrabold outline-none placeholder:font-semibold placeholder:text-suave/70 focus:border-tinta"
        />

        {/* Quando */}
        <div className="flex flex-col gap-2.5 rounded-2xl bg-superficie-2 p-3">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => mudarHorario(() => setDia(h))} className={`${chip(dia === h)} px-3! py-1.5! text-sm`}>
              Hoje
            </button>
            <button type="button" onClick={() => mudarHorario(() => setDia(somarDias(h, 1)))} className={`${chip(dia === somarDias(h, 1))} px-3! py-1.5! text-sm`}>
              Amanhã
            </button>
            <input
              type="date"
              required
              aria-label="Data"
              value={dia}
              onChange={(e) => e.target.value && mudarHorario(() => setDia(e.target.value))}
              className="min-w-0 flex-1 rounded-full border border-linha bg-fundo px-3 py-1.5 text-sm font-bold outline-none focus:border-tinta"
            />
          </div>

          {!diaInteiro && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-linha bg-fundo pl-3">
                <span className="text-xs font-bold text-suave">De</span>
                <input type="time" required aria-label="Começa" value={horaIni} onChange={(e) => e.target.value && mudarInicio(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 pr-2 font-extrabold outline-none" />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-linha bg-fundo pl-3">
                <span className="text-xs font-bold text-suave">até</span>
                <input type="time" required aria-label="Termina" value={horaFim} onChange={(e) => e.target.value && mudarHorario(() => setHoraFim(e.target.value))} className="min-w-0 flex-1 bg-transparent py-2.5 pr-2 font-extrabold outline-none" />
              </label>
            </div>
          )}

          <div className="sem-barra -mx-3 flex items-center gap-1.5 overflow-x-auto px-3">
            {!diaInteiro &&
              DURACOES.map((d) => (
                <button
                  type="button"
                  key={d.min}
                  onClick={() => mudarHorario(() => setHoraFim(deMin(paraMin(horaIni) + d.min)))}
                  className={`${chip(duracao === d.min)} shrink-0 px-3! py-1! text-xs`}
                >
                  {d.rotulo}
                </button>
              ))}
            <button type="button" onClick={() => mudarHorario(() => setDiaInteiro(!diaInteiro))} className={`${chip(diaInteiro)} shrink-0 px-3! py-1! text-xs`}>
              Dia todo
            </button>
          </div>
          {viraODia && <p className="text-xs font-bold text-suave">Termina no dia seguinte.</p>}
        </div>

        {cat.valor && (
          <label className="flex items-center gap-3 rounded-2xl border border-linha bg-fundo px-4">
            <span className="text-sm font-bold text-suave">{cat.valor.replace(" (R$)", "")}</span>
            <span className="font-extrabold text-suave">R$</span>
            <input
              id="valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="min-w-0 flex-1 bg-transparent py-3 text-right text-lg font-extrabold outline-none"
            />
          </label>
        )}

        {/* Músico: equipe a pagar */}
        {cat.equipe && (
          <EditorEquipe
            rotulo={cat.equipe.rotulo}
            item={cat.equipe.item}
            equipe={equipe}
            setEquipe={setEquipe}
            cache={textoParaValor(valor)}
            qtdRapida={qtdRapida}
            setQtdRapida={setQtdRapida}
            valorRapido={valorRapido}
            setValorRapido={setValorRapido}
          />
        )}

        {/* Mais detalhes (fechado por padrão: a tela fica limpa) */}
        <button
          type="button"
          onClick={() => setDetalhes(!detalhes)}
          aria-expanded={detalhes}
          className="flex items-center justify-between rounded-2xl px-1 py-1 text-sm font-extrabold text-suave hover:text-tinta"
        >
          <span>{detalhes ? "Menos detalhes" : `Mais detalhes${!editando ? " · repetir" : ""}`}</span>
          <span className={`transition ${detalhes ? "rotate-180" : ""}`}>▾</span>
        </button>

        {detalhes && (
          <div className="entrar flex flex-col gap-2.5">
            {(cat.cliente || cat.telefone) && (
              <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                {cat.cliente && (
                  <input
                    id="cliente"
                    aria-label={cat.cliente}
                    placeholder={cat.cliente}
                    value={cliente}
                    list="contatos"
                    autoComplete="off"
                    onChange={(e) => {
                      setCliente(e.target.value);
                      preencherTelefone(e.target.value);
                    }}
                    className={mini}
                  />
                )}
                {cat.telefone && (
                  <input id="tel" type="tel" inputMode="tel" aria-label="WhatsApp" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="WhatsApp com DDD" className={mini} />
                )}
              </div>
            )}
            {cat.local && <input id="local" aria-label={cat.local} placeholder={cat.local} value={local} onChange={(e) => setLocal(e.target.value)} className={mini} />}

            {!editando && (
              <div className="flex flex-col gap-2">
                <div className="sem-barra -mx-5 flex gap-1.5 overflow-x-auto px-5">
                  {REPETICOES.map((r) => (
                    <button type="button" key={r.id} onClick={() => setRepeticao(r.id)} className={`${chip(repeticao === r.id)} shrink-0 px-3! py-1.5! text-xs`}>
                      {r.rotulo}
                    </button>
                  ))}
                </div>
                {repeticao !== "nao" && (
                  <div className="flex items-center gap-3 rounded-xl bg-superficie-2 px-2 py-1.5">
                    <button type="button" onClick={() => setVezes(Math.max(2, vezes - 1))} aria-label="Menos" className="grid size-8 place-items-center rounded-full bg-fundo text-lg font-extrabold">−</button>
                    <span className="flex-1 text-center text-sm font-extrabold">
                      {vezes} vezes, até {formatar(inicioDoDia(diasDaRepeticao(dia, repeticao, vezes).at(-1)!), "d 'de' MMM")}
                    </span>
                    <button type="button" onClick={() => setVezes(Math.min(52, vezes + 1))} aria-label="Mais" className="grid size-8 place-items-center rounded-full bg-fundo text-lg font-extrabold">+</button>
                  </div>
                )}
              </div>
            )}

            <textarea id="obs" rows={2} aria-label="Observação" placeholder="Observação" value={observacao} onChange={(e) => setObservacao(e.target.value)} className={mini} />
          </div>
        )}

        {editando && (
          <div className="sem-barra -mx-5 flex gap-1.5 overflow-x-auto px-5">
            {cat.status.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-extrabold transition ${ESTILO_STATUS[s]} ${
                  status === s ? "ring-2 ring-current ring-offset-2 ring-offset-superficie" : "opacity-55"
                }`}
              >
                {ROTULO_STATUS[s]}
              </button>
            ))}
          </div>
        )}

        <datalist id="contatos">
          {contatos.map((c) => (
            <option key={c.nome} value={c.nome} />
          ))}
        </datalist>

        {conflitos && conflitos.length > 0 && (
          <div className="rounded-2xl border border-ambar/50 bg-ambar/10 p-3 text-sm">
            <p className="font-extrabold text-ambar">⚠️ Bate com:</p>
            <ul className="mt-0.5 font-bold">
              {conflitos.map((c) => (
                <li key={c.id}>
                  {CATEGORIAS.find((x) => x.id === c.categoria)?.emoji} {c.titulo}, {rotuloDia(diaDe(c.inicio)).toLowerCase()} {faixaHorario(c)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {erro && <p className="rounded-xl bg-coral/12 px-3 py-2 text-sm font-bold text-coral">{erro}</p>}

        <div className="sticky bottom-0 -mx-5 flex gap-2 bg-superficie px-5 pt-2 pb-1">
          <button type="button" onClick={aoFechar} className="rounded-2xl bg-superficie-2 px-5 py-3.5 font-extrabold text-suave">
            Cancelar
          </button>
          <button disabled={salvando} className="flex-1 rounded-2xl bg-tinta py-3.5 text-lg font-extrabold text-white disabled:opacity-60">
            {salvando ? "Salvando…" : conflitos?.length ? "Salvar mesmo assim" : "Salvar"}
          </button>
        </div>
      </form>
    </Folha>
  );
}

type LinhaEquipe = { nome: string; valor: string; pago: boolean };

/** Lista de quem precisa ser pago (ex.: 5 músicos) + o lucro que sobra do cachê. */
function EditorEquipe({
  rotulo,
  item,
  equipe,
  setEquipe,
  cache,
  qtdRapida,
  setQtdRapida,
  valorRapido,
  setValorRapido,
}: {
  rotulo: string;
  item: string;
  equipe: LinhaEquipe[];
  setEquipe: (e: LinhaEquipe[]) => void;
  cache: number | null;
  qtdRapida: string;
  setQtdRapida: (v: string) => void;
  valorRapido: string;
  setValorRapido: (v: string) => void;
}) {
  const total = equipe.reduce((t, m) => t + (textoParaValor(m.valor) || 0), 0);
  const lucro = (cache && !Number.isNaN(cache) ? cache : 0) - total;
  const mudar = (i: number, campo: keyof LinhaEquipe, v: string | boolean) =>
    setEquipe(equipe.map((m, j) => (j === i ? { ...m, [campo]: v } : m)));
  const adicionarVarios = () => {
    const n = Math.min(Math.max(parseInt(qtdRapida) || 0, 1), 20);
    const inicio = equipe.length;
    setEquipe([...equipe, ...Array.from({ length: n }, (_, k) => ({ nome: `${item} ${inicio + k + 1}`, valor: valorRapido, pago: false }))]);
  };
  const campo = "rounded-xl border border-linha bg-superficie px-2.5 py-2 text-sm font-bold outline-none focus:border-tinta";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-linha bg-fundo p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold">
          {rotulo}
          {equipe.length > 0 && <span className="text-suave"> · {equipe.length}</span>}
        </span>
        {equipe.length > 0 && (
          <button
            type="button"
            onClick={() => setEquipe([...equipe, { nome: `${item} ${equipe.length + 1}`, valor: equipe.at(-1)?.valor ?? "", pago: false }])}
            className="rounded-full bg-superficie-2 px-3 py-1 text-xs font-extrabold"
          >
            + {item}
          </button>
        )}
      </div>

      {equipe.map((m, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            aria-label={`Nome ou função do ${item.toLowerCase()} ${i + 1}`}
            value={m.nome}
            onChange={(e) => mudar(i, "nome", e.target.value)}
            placeholder="Ex.: Baterista"
            className={`${campo} min-w-0 flex-1`}
          />
          <label className={`${campo} flex w-28 shrink-0 items-center gap-1`}>
            <span className="text-xs text-suave">R$</span>
            <input
              inputMode="decimal"
              aria-label={`Valor do ${item.toLowerCase()} ${i + 1}`}
              value={m.valor}
              onChange={(e) => mudar(i, "valor", e.target.value)}
              placeholder="0,00"
              className="w-full min-w-0 bg-transparent text-right outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setEquipe(equipe.filter((_, j) => j !== i))}
            aria-label="Remover"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-suave hover:bg-superficie-2 hover:text-coral"
          >
            ×
          </button>
        </div>
      ))}

      {/* Atalho: vários de uma vez, com o mesmo valor */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-bold text-suave">{equipe.length ? "Mais" : "Pagar"}</span>
        <input
          inputMode="numeric"
          aria-label="Quantos"
          value={qtdRapida}
          onChange={(e) => setQtdRapida(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className={`${campo} w-11 text-center`}
        />
        <span className="font-bold text-suave">de R$</span>
        <input
          inputMode="decimal"
          aria-label="Valor de cada um"
          value={valorRapido}
          onChange={(e) => setValorRapido(e.target.value)}
          placeholder="200"
          className={`${campo} w-20 min-w-0 text-right`}
        />
        <button type="button" onClick={adicionarVarios} className="ml-auto shrink-0 rounded-xl bg-tinta px-3 py-2 text-xs font-extrabold text-white">
          Adicionar
        </button>
      </div>

      {(equipe.length > 0 || (cache ?? 0) > 0) && (
        <div className="mt-1 grid grid-cols-3 gap-1 border-t border-linha pt-2 text-center">
          <div>
            <p className="text-[11px] font-bold text-suave">Cachê</p>
            <p className="text-sm font-extrabold">{dinheiro(cache && !Number.isNaN(cache) ? cache : 0)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-suave">Equipe</p>
            <p className="text-sm font-extrabold text-coral">− {dinheiro(total)}</p>
          </div>
          <div className="rounded-xl bg-lima py-0.5">
            <p className="text-[11px] font-bold text-escuro/60">Seu lucro</p>
            <p className="text-sm font-extrabold text-escuro">{dinheiro(lucro)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
