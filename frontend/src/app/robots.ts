import type { MetadataRoute } from "next";

// App pessoal: só a tela de entrada interessa a buscadores; o resto exige login.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/login", disallow: ["/comecar"] } };
}
