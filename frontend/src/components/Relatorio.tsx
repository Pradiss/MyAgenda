"use client";

import { useEffect, useState } from "react";
import Folha from "./Folha";
import { tituloMes } from "./VisaoMes";
import { api, consulta } from "@/lib/api";
import type { Categoria } from "@/lib/categorias";
import { corDe } from "@/lib/cores";
import { custoEquipe, lucroDe } from "@/lib/compromissos";
import { dinheiro, isoDoDia, primeiroDoMes, somarMeses, type Dia } from "@/lib/datas";
import type { Compromisso } from "@/lib/tipos";

const soma = (l: Compromisso[]) => l.reduce((t, c) => t + Number(c.valor ?? 0), 0);

/** Resumo do mês: quanto foi feito, recebido e o que falta, por tipo. */
export default function Relatorio({ cat, diaInicial, aoFechar }: { cat: Categoria; diaInicial: Dia; aoFechar: () => void }) {
  const [mes, setMes] = useState(primeiroDoMes(diaInicial));
  const [lista, setLista] = useState<Compromisso[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let valido = true;
    setLista(null);
    api<Compromisso[]>(`/compromissos${consulta({ categoria: cat.id, de: isoDoDia(mes), ate: isoDoDia(somarMeses(mes, 1)) })}`)
      .then((r) => valido && (setLista(r.filter((c) => Date.parse(c.inicio) >= Date.parse(isoDoDia(mes)))) /* conta no mês em que começa */, setErro("")))
      .catch((e) => valido && setErro((e as Error).message));
    return () => {
      valido = false;
    };
  }, [cat.id, mes]);

  const ativos = lista?.filter((c) => c.status !== "cancelado") ?? [];
  const concluidos = ativos.filter((c) => c.status === "pago" || c.status === "feito");
  const pendentes = ativos.filter((c) => c.status !== "pago" && c.status !== "feito");
  const cancelados = (lista?.length ?? 0) - ativos.length;
  const porTipo = cat.tipos
    .map((t) => {
      const itens = ativos.filter((c) => c.tipo === t.id);
      return { ...t, qtd: itens.length, valor: soma(itens) };
    })
    .filter((t) => t.qtd > 0);
  const maior = Math.max(1, ...porTipo.map((t) => t.qtd));

  const Numero = ({ rotulo, valor, destaque = false }: { rotulo: string; valor: string | number; destaque?: boolean }) => (
    <div className={`rounded-2xl p-3 ${destaque ? "bg-tinta text-white" : "bg-superficie-2"}`}>
      <p className={`text-xs font-extrabold uppercase ${destaque ? "opacity-90" : "text-suave"}`}>{rotulo}</p>
      <p className="text-xl font-extrabold">{valor}</p>
    </div>
  );

  return (
    <Folha titulo="Resumo do mês" aoFechar={aoFechar}>
      <div className="mb-4 flex items-center justify-between rounded-full bg-superficie-2 p-1">
        <button onClick={() => setMes(somarMeses(mes, -1))} aria-label="Mês anterior" className="grid size-10 place-items-center rounded-full bg-fundo text-xl font-extrabold shadow-sm">‹</button>
        <span className="font-extrabold">{tituloMes(mes)}</span>
        <button onClick={() => setMes(somarMeses(mes, 1))} aria-label="Próximo mês" className="grid size-10 place-items-center rounded-full bg-fundo text-xl font-extrabold shadow-sm">›</button>
      </div>

      {erro && <p className="mb-3 rounded-xl bg-coral/12 px-3 py-2 text-sm font-bold text-coral">{erro}</p>}

      <div className={`flex flex-col gap-4 pb-2 ${lista ? "" : "animate-pulse opacity-50"}`}>
        {cat.valor ? (
          <div className="grid grid-cols-2 gap-2">
            <Numero rotulo="Recebido" valor={dinheiro(soma(concluidos))} destaque />
            <Numero rotulo="A receber" valor={dinheiro(soma(pendentes))} />
            {cat.equipe ? (
              <>
                <Numero rotulo="Equipe" valor={`− ${dinheiro(ativos.reduce((t, c) => t + custoEquipe(c), 0))}`} />
                <Numero rotulo="Seu lucro" valor={dinheiro(ativos.reduce((t, c) => t + lucroDe(c), 0))} />
              </>
            ) : (
              <>
                <Numero rotulo={ativos.length === 1 ? "Compromisso" : "Compromissos"} valor={ativos.length} />
                <Numero rotulo="Cancelados" valor={cancelados} />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Numero rotulo="Marcados" valor={ativos.length} destaque />
            <Numero rotulo="Feitos" valor={concluidos.length} />
            <Numero rotulo="Cancelados" valor={cancelados} />
          </div>
        )}

        {porTipo.length > 0 && (
          <div>
            <p className="mb-2 font-extrabold">Por tipo</p>
            <div className="flex flex-col gap-2">
              {porTipo.map((t, i) => (
                <div key={t.id}>
                  <div className="mb-1 flex justify-between text-sm font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: corDe(t.cor).forte }} />
                      {t.nome} · {t.qtd}
                    </span>
                    {cat.valor && <span className="text-suave">{dinheiro(t.valor)}</span>}
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-superficie-2">
                    <div className="h-full rounded-full" style={{ width: `${(t.qtd / maior) * 100}%`, background: i === 0 ? "#d4f55a" : "#111111" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lista && lista.length === 0 && <p className="py-4 text-center font-bold text-suave">Nada marcado neste mês.</p>}
      </div>
    </Folha>
  );
}
