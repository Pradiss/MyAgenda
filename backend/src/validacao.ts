import { z } from "zod";
import { CATEGORIAS, IDS_CATEGORIAS } from "./categorias.js";

z.config(z.locales.pt()); // mensagens de erro em português

const textoOpcional = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => v || null);

const campos = {
  categoria: z.enum(IDS_CATEGORIAS),
  tipo: z.string(),
  titulo: z.string().trim().min(1, "Preencha o título.").max(200),
  inicio: z.iso.datetime({ offset: true }),
  fim: z.iso.datetime({ offset: true }),
  dia_inteiro: z.boolean(),
  cliente: textoOpcional,
  telefone: z
    .string()
    .nullish()
    .transform((v) => v?.replace(/\D/g, "") || null)
    .refine((v) => v == null || v.length <= 15, "Telefone grande demais."),
  local: textoOpcional,
  valor: z.number().min(0).max(99_999_999).nullish().transform((v) => v ?? null),
  status: z.enum(["marcado", "confirmado", "pago", "feito", "cancelado"]),
  observacao: z.string().trim().max(2000).nullish().transform((v) => v || null),
  /** Músico: quem precisa ser pago neste compromisso. Lista vazia vira null. */
  equipe: z
    .array(
      z
        .object({
          nome: z.string().trim().max(60).default(""),
          valor: z.number().min(0).max(9_999_999),
          pago: z.boolean().default(false),
        })
        .strict(),
    )
    .max(30, "No máximo 30 pessoas na equipe.")
    .nullish()
    .transform((v) => (v && v.length ? v : null)),
};

type Regras = { categoria?: keyof typeof CATEGORIAS; tipo?: string; status?: string; inicio?: string; fim?: string };

/** Regras que dependem de mais de um campo. Devolve a lista de problemas (vazia = tudo certo). */
export function problemas(d: Regras): string[] {
  const lista: string[] = [];
  if (d.categoria) {
    const cat = CATEGORIAS[d.categoria];
    if (d.tipo !== undefined && !(cat.tipos as readonly string[]).includes(d.tipo)) lista.push("Tipo não existe nesta agenda.");
    if (d.status !== undefined && !(cat.status as readonly string[]).includes(d.status)) lista.push("Status não existe nesta agenda.");
  }
  if (d.inicio && d.fim && Date.parse(d.fim) <= Date.parse(d.inicio)) lista.push("O fim precisa ser depois do início.");
  return lista;
}

const ocorrencia = z.object({ inicio: z.iso.datetime({ offset: true }), fim: z.iso.datetime({ offset: true }) });

export const novoCompromisso = z
  .object({
    ...campos,
    // Padrões só na criação. Na edição, campo ausente = não mexe.
    dia_inteiro: campos.dia_inteiro.default(false),
    status: campos.status.default("marcado"),
    /** Para repetir: as datas de todas as vezes (a primeira incluída). Calculadas no frontend, no fuso de São Paulo. */
    ocorrencias: z.array(ocorrencia).min(2).max(60, "Dá para repetir no máximo 60 vezes.").optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const lista = [d, ...(d.ocorrencias ?? []).map((o) => ({ ...d, ...o }))];
    new Set(lista.flatMap(problemas)).forEach((message) => ctx.addIssue({ code: "custom", message }));
  });

// Na edição a categoria não muda; as regras são checadas junto com o registro salvo.
export const edicaoCompromisso = z.object(campos).omit({ categoria: true }).partial().strict();

export const consultaPeriodo = z.object({
  categoria: z.enum(IDS_CATEGORIAS).optional(),
  de: z.iso.datetime({ offset: true }),
  ate: z.iso.datetime({ offset: true }),
});

export const consultaProximos = z.object({
  categoria: z.enum(IDS_CATEGORIAS),
  limite: z.coerce.number().int().min(1).max(500).default(200),
});

export const consultaConflitos = z.object({
  inicio: z.iso.datetime({ offset: true }),
  fim: z.iso.datetime({ offset: true }),
  ignorar: z.uuid().optional(),
});

export const consultaBusca = z.object({
  categoria: z.enum(IDS_CATEGORIAS),
  // Tira curingas de busca (% _ *) e símbolos que não fazem sentido num nome.
  q: z
    .string()
    .transform((v) => v.replace(/[,()"\\%_*]/g, " ").trim())
    .pipe(z.string().min(2, "Digite pelo menos 2 letras.").max(80)),
});

export const consultaCategoria = z.object({ categoria: z.enum(IDS_CATEGORIAS) });

export const consultaExclusao = z.object({ serie: z.enum(["este", "proximos"]).default("este") });

export const idValido = z.uuid();

/** Junta as mensagens do zod numa frase legível. */
export const mensagem = (e: z.ZodError) => e.issues.map((i) => i.message).join(" ");
