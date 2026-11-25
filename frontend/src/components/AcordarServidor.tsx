"use client";

import { useEffect } from "react";

/**
 * No plano grátis do Render a API "dorme" depois de 15 min parada e leva ~1 min para acordar.
 * Este ping sai assim que o site abre (até na tela de login), para ela já estar de pé quando precisar.
 */
export default function AcordarServidor() {
  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    fetch(`${api}/saude`, { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
