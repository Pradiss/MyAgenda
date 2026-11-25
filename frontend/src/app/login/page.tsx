"use client";

import { ArrowRight, Check, Clock, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const campo =
  "w-full rounded-2xl border border-linha bg-fundo px-4 py-3.5 outline-none transition placeholder:text-suave/60 focus:border-tinta";

/** Cartões decorativos que "flutuam" atrás do formulário. */
function Vitrine() {
  return (
    <div aria-hidden className="pointer-events-none relative mx-auto h-56 w-full max-w-sm select-none">
      <div className="entrar absolute top-2 left-0 w-56 -rotate-6 rounded-3xl bg-tinta p-4 text-white shadow-2xl shadow-black/20" style={{ animationDelay: "80ms" }}>
        <p className="text-xs font-bold text-white/60">A receber em novembro</p>
        <p className="text-3xl font-extrabold tracking-tighter">R$ 4.280</p>
        <div className="mt-3 h-2 rounded-full bg-white/12">
          <div className="h-full w-2/3 rounded-full bg-lima" />
        </div>
      </div>
      <div className="entrar absolute top-16 right-0 w-52 rotate-3 rounded-3xl border border-linha bg-superficie p-4 shadow-2xl shadow-black/10" style={{ animationDelay: "160ms" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-2 px-2 py-0.5 text-[11px] font-extrabold">
          <span className="size-1.5 rounded-full bg-[#8b6cf0]" /> Show
        </span>
        <p className="mt-2 text-lg leading-tight font-extrabold">Bar do Zé</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-suave">
          <Clock size={12} /> em 2h 15min
        </p>
      </div>
      <div className="entrar absolute bottom-0 left-10 flex items-center gap-2 rounded-2xl bg-lima px-3.5 py-2.5 text-escuro shadow-2xl shadow-black/10" style={{ animationDelay: "240ms" }}>
        <MessageCircle size={16} />
        <span className="text-sm font-extrabold">Confirmado</span>
        <Check size={16} strokeWidth={3} />
      </div>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [criando, setCriando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEntrando(true);
    const { criarClienteNavegador } = await import("@/lib/supabase/client"); // só ao enviar
    const auth = criarClienteNavegador().auth;

    if (criando) {
      const { data, error } = await auth.signUp({ email, password: senha });
      setEntrando(false);
      if (error) return setErro(error.message.includes("registered") ? "Esse e-mail já tem conta. Entre com a senha." : error.message);
      if (!data.session) return setAviso("Conta criada! Abra o link que enviamos para o seu e-mail e depois entre aqui.");
    } else {
      const { error } = await auth.signInWithPassword({ email, password: senha });
      if (error) {
        setEntrando(false);
        return setErro("E-mail ou senha incorretos.");
      }
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="brilho min-h-dvh" style={{ "--acento": "#9b7bff", "--acento-2": "#ff5ca8" } as React.CSSProperties}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-10">
        <Vitrine />

        <div className="entrar text-center" style={{ animationDelay: "300ms" }}>
          <h1 className="text-4xl leading-[1.2] font-extrabold tracking-tight">
            Sua agenda,
            <br />
            <span className="mt-1 inline-block rounded-xl bg-lima px-2 leading-[1.15]">no controle.</span>
          </h1>
          <p className="mt-3 text-suave">Compromissos, clientes e valores em um só lugar.</p>
        </div>

        <form onSubmit={entrar} className="entrar flex flex-col gap-3" style={{ animationDelay: "380ms" }}>
          <input
            type="email"
            autoComplete="email"
            required
            aria-label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
          <input
            type="password"
            autoComplete={criando ? "new-password" : "current-password"}
            minLength={6}
            required
            aria-label="Senha"
            placeholder={criando ? "Crie uma senha (mín. 6)" : "Senha"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={campo}
          />

          {erro && <p className="rounded-2xl bg-coral/12 px-4 py-2.5 text-sm font-bold text-coral">{erro}</p>}
          {aviso && <p className="rounded-2xl bg-lima px-4 py-2.5 text-sm font-bold text-escuro">{aviso}</p>}

          <button
            disabled={entrando}
            className="arco mt-1 flex h-14 items-center justify-center gap-2 rounded-full text-lg font-extrabold text-white shadow-xl shadow-black/15 transition active:scale-[0.98] disabled:opacity-60"
          >
            {entrando ? "Aguarde…" : criando ? "Criar conta" : "Entrar"} {!entrando && <ArrowRight size={20} />}
          </button>

          <button
            type="button"
            onClick={() => {
              setCriando(!criando);
              setErro("");
              setAviso("");
            }}
            className="py-2 text-center text-sm font-bold text-suave transition hover:text-tinta"
          >
            {criando ? (
              <>
                Já tem conta? <span className="text-tinta underline decoration-lima decoration-2 underline-offset-4">Entrar</span>
              </>
            ) : (
              <>
                Novo por aqui? <span className="text-tinta underline decoration-lima decoration-2 underline-offset-4">Criar conta grátis</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
