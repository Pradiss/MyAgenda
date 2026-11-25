import type { CategoriaId } from "./categorias";

export type Status = "marcado" | "confirmado" | "pago" | "feito" | "cancelado";

export const ROTULO_STATUS: Record<Status, string> = {
  marcado: "Marcado",
  confirmado: "Confirmado",
  pago: "Pago",
  feito: "Feito",
  cancelado: "Cancelado",
};

export type Compromisso = {
  id: string;
  user_id: string;
  categoria: CategoriaId;
  tipo: string;
  titulo: string;
  inicio: string;
  fim: string;
  dia_inteiro: boolean;
  cliente: string | null;
  telefone: string | null;
  local: string | null;
  valor: number | null;
  status: Status;
  observacao: string | null;
  /** Compromissos repetidos compartilham o mesmo serie_id. */
  serie_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

/** O que o formulário envia ao banco. Sem `id` = compromisso novo. */
export type Rascunho = Omit<Compromisso, "id" | "user_id" | "serie_id" | "criado_em" | "atualizado_em"> & {
  id?: string;
};
