import { categoriaDe, type Categoria } from "./categorias";
import { criarClienteServidor } from "./supabase/server";

/** Quem está logado e qual agenda escolheu (fica salvo na conta, em user_metadata). */
export async function sessaoAtual(): Promise<{
  email: string;
  cat: Categoria | undefined;
  /** Token já renovado pelo proxy: o app busca os dados sem precisar carregar o Supabase antes. */
  token: { valor: string; expiraEm: number } | null;
} | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims(); // confere a assinatura do token
  if (!data?.claims) return null;
  const meta = (data.claims.user_metadata ?? {}) as { categoria?: string };
  const { data: s } = await supabase.auth.getSession(); // só para repassar o mesmo token ao navegador
  const token = s.session ? { valor: s.session.access_token, expiraEm: s.session.expires_at ?? 0 } : null;
  return { email: String(data.claims.email ?? ""), cat: categoriaDe(meta.categoria ?? ""), token };
}
