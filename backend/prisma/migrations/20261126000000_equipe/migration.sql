-- Músico: equipe a pagar em cada compromisso (ex.: 5 músicos, cada um com o seu valor).
-- Lista em JSON: [{ "nome": "Baterista", "valor": 200, "pago": false }, ...]. Vazio = null.
alter table public.compromissos add column equipe jsonb;
