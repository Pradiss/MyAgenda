
let saindo = false;

/** Token entregue pelo servidor junto com a página (evita carregar o Supabase antes dos dados). */
let tokenInicial: { valor: string; expira: number } | null = null;

export function definirTokenInicial(t: { valor: string; expiraEm: number } | null | undefined) {
  if (t?.valor) tokenInicial = { valor: t.valor, expira: t.expiraEm * 1000 };
}

async function tokenAtual(): Promise<string | undefined> {
  if (tokenInicial && tokenInicial.expira - Date.now() > 60_000) return tokenInicial.valor;
  tokenInicial = null;
  // Perto de expirar (ou sem token do servidor): o Supabase renova. Carregado sob demanda.
  const { criarClienteNavegador } = await import("./supabase/client");
  const { data } = await criarClienteNavegador().auth.getSession();
  return data.session?.access_token;
}

const CONFIGURADA = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const LOCAIS = ["localhost", "127.0.0.1"];

/**
 * Endereço da API. Em desenvolvimento a API é "localhost:4000"; se o site foi aberto por outro
 * endereço (ex.: o IP do Mac, no celular), usa esse mesmo endereço para achar a API.
 */
export function urlDaApi(): string {
  if (typeof window === "undefined") return CONFIGURADA;
  try {
    const u = new URL(CONFIGURADA);
    if (LOCAIS.includes(u.hostname) && !LOCAIS.includes(window.location.hostname)) {
      u.hostname = window.location.hostname;
      return u.toString().replace(/\/$/, "");
    }
  } catch {
    // URL inválida: usa como está
  }
  return CONFIGURADA;
}

/** Chama a API do backend com o token do usuário logado. Erros viram `Error` com mensagem em português. */
export async function api<T = unknown>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const token = await tokenAtual();

  let resposta: Response;
  try {
    resposta = await fetch(`${urlDaApi()}${caminho}`, {
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
    tokenInicial = null;
    const { criarClienteNavegador } = await import("./supabase/client");
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
