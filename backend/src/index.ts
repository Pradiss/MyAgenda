import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import { rotas } from "./rotas.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // atrás do proxy do Render
// Em desenvolvimento, aceita também localhost/127.0.0.1 e IPs da rede de casa (testar no celular).
const REDE_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
const emProducao = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: (origem, ok) => ok(null, !origem || config.origens.includes(origem) || (!emProducao && REDE_LOCAL.test(origem))),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "50kb" }));

// O Render usa esta rota para saber se o servidor está de pé.
app.get("/saude", (_req, res) => res.json({ ok: true }));

app.use(rotas);

app.use((_req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((erro: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (erro.type === "entity.parse.failed") return res.status(400).json({ erro: "JSON inválido." });
  console.error(erro);
  res.status(erro.status ?? 500).json({ erro: "Erro inesperado no servidor." });
});

app.listen(config.porta, "0.0.0.0", () => {
  console.log(`API da Agenda na porta ${config.porta}. Frontend liberado: ${config.origens.join(", ")}`);
});
