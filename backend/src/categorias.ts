// Regras de cada agenda. Os nomes e cores ficam no frontend; aqui só o que valida os dados.

export const CATEGORIAS = {
  trabalho: {
    tipos: ["reuniao", "tarefa", "prazo", "visita", "outro"],
    status: ["marcado", "feito", "cancelado"],
  },
  musico: {
    tipos: ["show", "ensaio", "aula", "gravacao", "outro"],
    status: ["marcado", "confirmado", "pago", "cancelado"],
  },
  estetica: {
    tipos: ["cabelo", "unhas", "sobrancelha", "maquiagem", "pele", "outro"],
    status: ["marcado", "confirmado", "pago", "cancelado"],
  },
} as const;

export type CategoriaId = keyof typeof CATEGORIAS;
export const IDS_CATEGORIAS = Object.keys(CATEGORIAS) as [CategoriaId, ...CategoriaId[]];
