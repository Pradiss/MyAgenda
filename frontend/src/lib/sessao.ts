import { categoriaDe, type Categoria } from "./categorias";
import { criarClienteServidor } from "./supabase/server";

/** Quem está logado e qual agenda escolheu (fica salvo na conta, em user_metadata). */
export async function sessaoAtual(): Promise<{ email: string; cat: Categoria | undefined } | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const meta = (data.claims.user_metadata ?? {}) as { categoria?: string };
  return { email: String(data.claims.email ?? ""), cat: categoriaDe(meta.categoria ?? "") };
}
