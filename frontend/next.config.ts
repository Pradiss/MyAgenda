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
  // O CSS (Tailwind, pequeno) vai dentro do HTML: a primeira tela não espera outro arquivo.
  experimental: { inlineCss: true },
};

export default withSerwist(nextConfig);
