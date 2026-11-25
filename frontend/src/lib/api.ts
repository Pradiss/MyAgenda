
let saindo = false;

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/** Chama a API do backend com o token do usuário logado. Erros viram `Error` com mensagem em português. */
export async function api<T = unknown>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  // Carregado sob demanda: não pesa na primeira pintura da tela.
  const { criarClienteNavegador } = await import("./supabase/client");
  const { data } = await criarClienteNavegador().auth.getSession();
  const token = data.session?.access_token;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opcoes.corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Confira a internet e tente de novo.");
  }

  // Sessão recusada pela API: sai de verdade (senão o site manda de volta para "/" e entra em loop).
  if (resposta.status === 401 && typeof window !== "undefined" && !saindo) {
    saindo = true;
    await criarClienteNavegador().auth.signOut().catch(() => {});
    window.location.href = "/login";
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(corpo?.erro ?? `Erro ${resposta.status}`);
  }
  return resposta.status === 204 ? (undefined as T) : resposta.json();
}

/** Monta "?a=1&b=2" ignorando valores vazios. */
export const consulta = (p: Record<string, string | undefined>) =>
  "?" + new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => Boolean(e[1]))).toString();
