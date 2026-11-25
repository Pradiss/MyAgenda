"use client";

import { useEffect } from "react";
import { urlDaApi } from "@/lib/api";

/**
 * No plano grátis do Render a API "dorme" depois de 15 min parada e leva ~1 min para acordar.
 * Este ping sai assim que o site abre (até na tela de login), para ela já estar de pé quando precisar.
 */
export default function AcordarServidor() {
  useEffect(() => {
    fetch(`${urlDaApi()}/saude`, { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
