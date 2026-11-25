"use client";

import { useEffect, useState } from "react";
import Folha from "./Folha";
import { ESTILO_STATUS } from "./Cartao";
import { CATEGORIAS, tipoDe, type Categoria } from "@/lib/categorias";
import { estiloCor } from "@/lib/cores";
import { faixaHorario } from "@/lib/compromissos";
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
  const [maisCampos, setMaisCampos] = useState(Boolean(inicial.observacao));
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

    const inicio = diaInteiro ? isoDoDia(dia) : paraISO(dia, horaIni);
    const fim = diaInteiro ? isoDoDia(somarDias(dia, 1)) : paraISO(viraODia ? somarDias(dia, 1) : dia, horaFim);

    const dados = {
      categoria: cat.id,
      tipo,
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

  return (
    <Folha titulo={editando ? "Editar" : `Novo · ${cat.nome}`} aoFechar={aoFechar} estilo={estiloCor(tipoDe(cat, tipo).cor)}>
      <form onSubmit={salvar} className="flex flex-col gap-5 pt-1">
        {/* 1. O quê */}
        <div>
          <span className={rotulo}>Tipo</span>
          <div className="flex flex-wrap gap-2">
            {cat.tipos.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTipo(t.id)}
                style={estiloCor(t.cor)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 font-extrabold transition active:scale-95 ${
                  t.id === tipo ? "border-tinta bg-tinta text-white" : "border-linha bg-fundo text-tinta"
                }`}
              >
                <span className="size-2.5 rounded-full bg-(--c)" />
                {t.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={rotulo} htmlFor="titulo">{cat.titulo.rotulo}</label>
          <input
            id="titulo"
            required
            autoFocus={!editando}
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              if (nomeEhTitulo) preencherTelefone(e.target.value);
            }}
            placeholder={cat.titulo.exemplo}
            list={nomeEhTitulo ? "contatos" : undefined}
            autoComplete="off"
            className={campo}
          />
        </div>

        {/* 2. Quando */}
        <div className="flex flex-col gap-3 rounded-3xl bg-superficie-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => mudarHorario(() => setDia(h))} className={chip(dia === h)}>Hoje</button>
            <button type="button" onClick={() => mudarHorario(() => setDia(somarDias(h, 1)))} className={chip(dia === somarDias(h, 1))}>
              Amanhã
            </button>
            <input
              type="date"
              required
              aria-label="Data"
              value={dia}
              onChange={(e) => e.target.value && mudarHorario(() => setDia(e.target.value))}
              className="min-w-0 flex-1 rounded-full border border-linha bg-fundo px-3 py-1.5 font-bold outline-none focus:border-tinta"
            />
          </div>
          <p className="-mt-1 text-sm font-extrabold text-suave">{rotuloDia(dia)}</p>

          {!diaInteiro && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={rotulo} htmlFor="ini">Começa</label>
                  <input id="ini" type="time" required value={horaIni} onChange={(e) => e.target.value && mudarInicio(e.target.value)} className={campo} />
                </div>
                <div>
                  <label className={rotulo} htmlFor="fim">Termina</label>
                  <input id="fim" type="time" required value={horaFim} onChange={(e) => e.target.value && mudarHorario(() => setHoraFim(e.target.value))} className={campo} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DURACOES.map((d) => (
                  <button
                    type="button"
                    key={d.min}
                    onClick={() => mudarHorario(() => setHoraFim(deMin(paraMin(horaIni) + d.min)))}
                    className={`${chip(duracao === d.min)} px-3! py-1! text-sm`}
                  >
                    {d.rotulo}
                  </button>
                ))}
              </div>
              {viraODia && <p className="text-sm font-bold text-suave">Termina no dia seguinte.</p>}
            </>
          )}

          <label className="flex items-center justify-between font-extrabold">
            Dia inteiro
            <input type="checkbox" checked={diaInteiro} onChange={(e) => mudarHorario(() => setDiaInteiro(e.target.checked))} className="size-6 accent-tinta" />
          </label>
        </div>

        <datalist id="contatos">
          {contatos.map((c) => (
            <option key={c.nome} value={c.nome} />
          ))}
        </datalist>

        {/* Repetir (só ao criar) */}
        {!editando && (
          <div>
            <span className={rotulo}>Repetir</span>
            <div className="flex flex-wrap gap-2">
              {REPETICOES.map((r) => (
                <button type="button" key={r.id} onClick={() => setRepeticao(r.id)} className={`${chip(repeticao === r.id)} px-3! py-1.5! text-sm`}>
                  {r.rotulo}
                </button>
              ))}
            </div>
            {repeticao !== "nao" && (
              <div className="mt-2 flex items-center gap-3 rounded-2xl bg-superficie-2 px-3 py-2">
                <button type="button" onClick={() => setVezes(Math.max(2, vezes - 1))} aria-label="Menos" className="grid size-9 place-items-center rounded-full bg-fundo text-xl font-extrabold">−</button>
                <span className="flex-1 text-center font-extrabold">
                  {vezes} vezes, até {formatar(inicioDoDia(diasDaRepeticao(dia, repeticao, vezes).at(-1)!), "d 'de' MMM")}
                </span>
                <button type="button" onClick={() => setVezes(Math.min(52, vezes + 1))} aria-label="Mais" className="grid size-9 place-items-center rounded-full bg-fundo text-xl font-extrabold">+</button>
              </div>
            )}
          </div>
        )}

        {/* 3. Detalhes da agenda */}
        {(cat.cliente || cat.telefone || cat.local || cat.valor) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cat.cliente && (
              <div>
                <label className={rotulo} htmlFor="cliente">{cat.cliente}</label>
                <input
                  id="cliente"
                  value={cliente}
                  list="contatos"
                  autoComplete="off"
                  onChange={(e) => {
                    setCliente(e.target.value);
                    preencherTelefone(e.target.value);
                  }}
                  className={campo}
                />
              </div>
            )}
            {cat.telefone && (
              <div>
                <label className={rotulo} htmlFor="tel">WhatsApp (com DDD)</label>
                <input id="tel" type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11 98765-4321" className={campo} />
              </div>
            )}
            {cat.local && (
              <div>
                <label className={rotulo} htmlFor="local">{cat.local}</label>
                <input id="local" value={local} onChange={(e) => setLocal(e.target.value)} className={campo} />
              </div>
            )}
            {cat.valor && (
              <div>
                <label className={rotulo} htmlFor="valor">{cat.valor}</label>
                <input id="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={campo} />
              </div>
            )}
          </div>
        )}

        {editando && (
          <div>
            <span className={rotulo}>Status</span>
            <div className="flex flex-wrap gap-2">
              {cat.status.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-full px-4 py-2 font-extrabold transition ${ESTILO_STATUS[s]} ${
                    status === s ? "ring-2 ring-current ring-offset-2 ring-offset-superficie" : "opacity-55"
                  }`}
                >
                  {ROTULO_STATUS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {maisCampos ? (
          <div>
            <label className={rotulo} htmlFor="obs">Observação</label>
            <textarea id="obs" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} className={campo} />
          </div>
        ) : (
          <button type="button" onClick={() => setMaisCampos(true)} className="self-start font-extrabold text-suave hover:text-tinta">
            + Adicionar observação
          </button>
        )}

        {conflitos && conflitos.length > 0 && (
          <div className="rounded-2xl border border-ambar/50 bg-ambar/10 p-3 text-ambar">
            <p className="font-extrabold">⚠️ Esse horário bate com:</p>
            <ul className="mt-1 text-sm font-bold">
              {conflitos.map((c) => (
                <li key={c.id}>
                  {CATEGORIAS.find((x) => x.id === c.categoria)?.emoji} {c.titulo}, {rotuloDia(diaDe(c.inicio)).toLowerCase()} {faixaHorario(c)}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-sm">Se estiver certo, é só salvar de novo.</p>
          </div>
        )}

        {erro && <p className="rounded-xl bg-coral/12 px-3 py-2 text-sm font-bold text-coral">{erro}</p>}

        <div className="sticky bottom-0 -mx-5 flex gap-2 bg-superficie px-5 pt-3 pb-1">
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
