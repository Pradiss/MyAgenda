"use client";

import { useEffect, useState } from "react";
import Cartao from "./Cartao";
import Folha from "./Folha";
import { api, consulta } from "@/lib/api";
import type { Categoria } from "@/lib/categorias";
import { diaDe, rotuloDia } from "@/lib/datas";
import type { Compromisso, Status } from "@/lib/tipos";

export default function Busca({
  cat,
  aoFechar,
  aoAbrir,
  aoMudarStatus,
}: {
  cat: Categoria;
  aoFechar: () => void;
  aoAbrir: (c: Compromisso) => void;
  aoMudarStatus: (c: Compromisso, s: Status) => void;
}) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Compromisso[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) {
      setResultado(null);
      return;
    }
    let valido = true;
    const espera = setTimeout(() => {
      api<Compromisso[]>(`/compromissos/busca${consulta({ categoria: cat.id, q })}`)
        .then((r) => valido && (setResultado(r), setErro("")))
        .catch((e) => valido && setErro((e as Error).message));
    }, 300);
    return () => {
      valido = false;
      clearTimeout(espera);
    };
  }, [texto, cat.id]);

  return (
    <Folha titulo={`Buscar em ${cat.nome}`} aoFechar={aoFechar}>
      <input
        autoFocus
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={cat.id === "estetica" ? "Nome da cliente…" : "Nome, contato ou local…"}
        className="mb-4 w-full rounded-2xl border border-linha px-4 py-3 outline-none focus:border-tinta"
      />
      {erro && <p className="mb-3 rounded-xl bg-coral/12 px-3 py-2 text-sm font-bold text-coral">{erro}</p>}
      {resultado?.length === 0 && <p className="py-6 text-center font-bold text-suave">Nada encontrado.</p>}
      <div className="flex flex-col gap-3 pb-2">
        {resultado?.map((c) => (
          <div key={c.id}>
            <p className="mb-1 text-sm font-extrabold text-suave">{rotuloDia(diaDe(c.inicio), "EEEE, d 'de' MMM 'de' yyyy")}</p>
            <Cartao
              c={c}
              cat={cat}
              aoAbrir={aoAbrir}
              aoMudarStatus={(c, s) => {
                setResultado((r) => r?.map((x) => (x.id === c.id ? { ...x, status: s } : x)) ?? r);
                aoMudarStatus(c, s);
              }}
            />
          </div>
        ))}
      </div>
    </Folha>
  );
}
