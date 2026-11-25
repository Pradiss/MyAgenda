import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** id do usuário logado. Toda consulta ao banco filtra por ele. */
      usuarioId: string;
    }
  }
}

// O Supabase só é usado aqui, para conferir o token do login.
const supabase = createClient(config.supabaseUrl, config.supabaseChave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Exige o cabeçalho `Authorization: Bearer <token do Supabase>`. */
export async function exigirLogin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ erro: "Faça login para continuar." });

  let usuarioId: string | undefined;
  try {
    const { data, error } = await supabase.auth.getClaims(token);
    if (!error) usuarioId = data?.claims?.sub;
  } catch {
    // token malformado
  }
  if (!usuarioId) return res.status(401).json({ erro: "Sessão expirada. Entre de novo." });

  req.usuarioId = usuarioId;
  next();
}
