import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Em desenvolvimento o service worker só atrapalha (cache de código antigo).
  disable: process.env.NODE_ENV === "development",
  // Não recarregar a página sozinho ao voltar a conexão: perderia um formulário aberto.
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  // Permite abrir o modo dev pelo IP do computador (ex.: testar no celular na mesma rede).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // O CSS (Tailwind, pequeno) vai dentro do HTML: a primeira tela não espera outro arquivo.
  experimental: { inlineCss: true },
};

export default withSerwist(nextConfig);
