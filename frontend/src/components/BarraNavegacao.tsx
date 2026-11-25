"use client";

import { CalendarDays, House, ListTodo, Plus, UserRound } from "lucide-react";

export type Aba = "inicio" | "agenda" | "lista" | "perfil";

const ITENS = [
  { id: "inicio", rotulo: "Início", icone: House },
  { id: "agenda", rotulo: "Agenda", icone: CalendarDays },
  { id: "lista", rotulo: "Lista", icone: ListTodo },
  { id: "perfil", rotulo: "Perfil", icone: UserRound },
] as const;

/** Barra flutuante de abas, com o botão de marcar no meio. */
export default function BarraNavegacao({ aba, aoMudar, aoNovo }: { aba: Aba; aoMudar: (a: Aba) => void; aoNovo: () => void }) {
  const botao = (item: (typeof ITENS)[number]) => {
    const ativo = aba === item.id;
    const Icone = item.icone;
    return (
      <button
        key={item.id}
        onClick={() => aoMudar(item.id)}
        aria-current={ativo ? "page" : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-bold transition ${ativo ? "text-tinta" : "text-suave hover:text-tinta"}`}
      >
        <span className={`grid h-7 w-11 place-items-center rounded-full transition ${ativo ? "bg-lima" : ""}`}>
          <Icone size={19} strokeWidth={ativo ? 2.5 : 2} />
        </span>
        {item.rotulo}
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="vidro mx-auto flex max-w-md items-center gap-1 rounded-[1.5rem] border border-linha p-1 shadow-xl shadow-black/8">
        {botao(ITENS[0])}
        {botao(ITENS[1])}
        <button
          onClick={aoNovo}
          aria-label="Marcar compromisso"
          className="arco mx-1 grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg shadow-black/20 transition hover:scale-105 active:scale-95"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
        {botao(ITENS[2])}
        {botao(ITENS[3])}
      </div>
    </nav>
  );
}
