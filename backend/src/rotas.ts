import { randomUUID } from "node:crypto";
import { Router } from "express";
import { exigirLogin } from "./auth.js";
import { paraBanco, paraJson, prisma } from "./db.js";
import {
  consultaBusca,
  consultaCategoria,
  consultaConflitos,
  consultaExclusao,
  consultaPeriodo,
  consultaProximos,
  edicaoCompromisso,
  idValido,
  mensagem,
  novoCompromisso,
  normalizarServicos,
  problemas,
} from "./validacao.js";

// IMPORTANTE: o Prisma entra no banco como administrador (o RLS não se aplica).
// Por isso TODA consulta abaixo filtra por `user_id: req.usuarioId`.

export const rotas = Router();
rotas.use(exigirLogin);

const ativo = { not: "cancelado" };

/** Compromissos que tocam o período [de, ate). */
rotas.get("/compromissos", async (req, res) => {
  const q = consultaPeriodo.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const lista = await prisma.compromisso.findMany({
    where: { user_id: req.usuarioId, categoria: q.data.categoria, inicio: { lt: q.data.ate }, fim: { gt: q.data.de } },
    orderBy: { inicio: "asc" },
  });
  res.json(lista.map(paraJson));
});

/** O que ainda vai acontecer (sem os cancelados). */
rotas.get("/compromissos/proximos", async (req, res) => {
  const q = consultaProximos.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const lista = await prisma.compromisso.findMany({
    where: { user_id: req.usuarioId, categoria: q.data.categoria, fim: { gt: new Date() }, status: ativo },
    orderBy: { inicio: "asc" },
    take: q.data.limite,
  });
  res.json(lista.map(paraJson));
});

/** Compromissos (de qualquer agenda) que batem com um horário. */
rotas.get("/compromissos/conflitos", async (req, res) => {
  const q = consultaConflitos.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const lista = await prisma.compromisso.findMany({
    where: {
      user_id: req.usuarioId,
      inicio: { lt: q.data.fim },
      fim: { gt: q.data.inicio },
      dia_inteiro: false,
      status: ativo,
      ...(q.data.ignorar ? { id: { not: q.data.ignorar } } : {}),
    },
    select: { id: true, categoria: true, titulo: true, inicio: true, fim: true, dia_inteiro: true },
    orderBy: { inicio: "asc" },
  });
  res.json(lista);
});

/** Procura por nome, cliente, local ou observação. Mais recentes primeiro. */
rotas.get("/compromissos/busca", async (req, res) => {
  const q = consultaBusca.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const termo = { contains: q.data.q, mode: "insensitive" as const };
  const lista = await prisma.compromisso.findMany({
    where: {
      user_id: req.usuarioId,
      categoria: q.data.categoria,
      OR: [{ titulo: termo }, { cliente: termo }, { local: termo }, { observacao: termo }],
    },
    orderBy: { inicio: "desc" },
    take: 50,
  });
  res.json(lista.map(paraJson));
});

/** Quantos compromissos cada agenda tem no período (para a tela de escolher agenda). */
rotas.get("/resumo", async (req, res) => {
  const q = consultaPeriodo.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const grupos = await prisma.compromisso.groupBy({
    by: ["categoria"],
    where: { user_id: req.usuarioId, inicio: { lt: q.data.ate }, fim: { gt: q.data.de }, status: ativo },
    _count: { _all: true },
  });
  const contagem: Record<string, number> = { trabalho: 0, musico: 0, estetica: 0 };
  for (const g of grupos) contagem[g.categoria] = g._count._all;
  res.json(contagem);
});

/** Pessoas já usadas nesta agenda (para completar o nome e o WhatsApp sozinhos). */
rotas.get("/contatos", async (req, res) => {
  const q = consultaCategoria.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const lista = await prisma.compromisso.findMany({
    where: { user_id: req.usuarioId, categoria: q.data.categoria },
    select: { titulo: true, cliente: true, telefone: true },
    orderBy: { inicio: "desc" },
    take: 1000,
  });

  // Na Estética o nome da cliente é o título; nas outras, o campo "cliente".
  const porNome = new Map<string, { nome: string; telefone: string | null }>();
  for (const c of lista) {
    const nome = (q.data.categoria === "estetica" ? c.titulo : c.cliente)?.trim();
    if (!nome) continue;
    const chave = nome.toLocaleLowerCase("pt-BR");
    const atual = porNome.get(chave);
    if (!atual) porNome.set(chave, { nome, telefone: c.telefone });
    else if (!atual.telefone && c.telefone) atual.telefone = c.telefone;
  }
  res.json([...porNome.values()].slice(0, 300));
});

rotas.post("/compromissos", async (req, res) => {
  const corpo = novoCompromisso.safeParse(req.body);
  if (!corpo.success) return res.status(400).json({ erro: mensagem(corpo.error) });

  const { ocorrencias, ...base } = corpo.data;
  const dados = paraBanco({ ...base, user_id: req.usuarioId });

  if (!ocorrencias) {
    const criado = await prisma.compromisso.create({ data: dados });
    return res.status(201).json(paraJson(criado));
  }

  // Repetição: uma linha para cada vez, todas com o mesmo serie_id.
  const serie_id = randomUUID();
  const criados = await prisma.compromisso.createManyAndReturn({
    data: ocorrencias.map((o) => ({ ...dados, ...o, serie_id })),
  });
  res.status(201).json(criados.map(paraJson));
});

rotas.patch("/compromissos/:id", async (req, res) => {
  const id = idValido.safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ erro: "Compromisso não encontrado." });
  const parse = edicaoCompromisso.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: mensagem(parse.error) });
  const corpo = { data: normalizarServicos(parse.data) };

  const atual = await prisma.compromisso.findFirst({ where: { id: id.data, user_id: req.usuarioId } });
  if (!atual) return res.status(404).json({ erro: "Compromisso não encontrado." });

  const erros = problemas({
    categoria: atual.categoria as "trabalho" | "musico" | "estetica",
    tipo: corpo.data.tipo ?? atual.tipo,
    servicos: corpo.data.servicos,
    status: corpo.data.status ?? atual.status,
    inicio: corpo.data.inicio ?? atual.inicio.toISOString(),
    fim: corpo.data.fim ?? atual.fim.toISOString(),
  });
  if (erros.length) return res.status(400).json({ erro: erros.join(" ") });

  const salvo = await prisma.compromisso.update({ where: { id: atual.id }, data: paraBanco(corpo.data) });
  res.json(paraJson(salvo));
});

/** Exclui um. Com ?serie=proximos, exclui também as próximas vezes da repetição. */
rotas.delete("/compromissos/:id", async (req, res) => {
  const id = idValido.safeParse(req.params.id);
  if (!id.success) return res.status(404).json({ erro: "Compromisso não encontrado." });
  const q = consultaExclusao.safeParse(req.query);
  if (!q.success) return res.status(400).json({ erro: mensagem(q.error) });

  const atual = await prisma.compromisso.findFirst({
    where: { id: id.data, user_id: req.usuarioId },
    select: { id: true, serie_id: true, inicio: true },
  });
  if (!atual) return res.status(404).json({ erro: "Compromisso não encontrado." });

  if (q.data.serie === "proximos" && atual.serie_id) {
    await prisma.compromisso.deleteMany({
      where: { user_id: req.usuarioId, serie_id: atual.serie_id, inicio: { gte: atual.inicio } },
    });
  } else {
    await prisma.compromisso.delete({ where: { id: atual.id } });
  }
  res.status(204).end();
});
