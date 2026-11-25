"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Painel que sobe de baixo no celular e vira janela centralizada no computador. */
export default function Folha({
  titulo,
  aoFechar,
  children,
  estilo,
}: {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  estilo?: React.CSSProperties;
}) {
  const fechar = useRef(aoFechar);
  useEffect(() => {
    fechar.current = aoFechar;
  });

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar.current();
    window.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="animar-fundo absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={aoFechar} />
      <div
        style={estilo}
        className="animar-folha relative flex max-h-[92dvh] w-full flex-col rounded-t-[2rem] border-t border-linha bg-superficie shadow-2xl md:max-w-lg md:rounded-[2rem] md:border"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-linha md:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <h2 className="truncate text-xl font-extrabold tracking-tight">{titulo}</h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-suave transition hover:text-tinta"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
