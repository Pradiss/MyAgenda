// Gera os ícones PNG do app (sem dependências): node scripts/gerar-icones.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function bloco(tipo, dados) {
  const t = Buffer.from(tipo);
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
}
function png(tamanho, pixel) {
  const linhas = Buffer.alloc((tamanho * 3 + 1) * tamanho);
  const S = 4; // supersampling para bordas suaves
  for (let y = 0; y < tamanho; y++) {
    linhas[y * (tamanho * 3 + 1)] = 0;
    for (let x = 0; x < tamanho; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++) {
          const c = pixel((x + (sx + 0.5) / S) / tamanho, (y + (sy + 0.5) / S) / tamanho);
          r += c[0]; g += c[1]; b += c[2];
        }
      const i = y * (tamanho * 3 + 1) + 1 + x * 3;
      linhas[i] = r / (S * S); linhas[i + 1] = g / (S * S); linhas[i + 2] = b / (S * S);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(linhas, { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BRANCO = [255, 255, 255];
// Visual neutro: fundo preto, calendário branco, bolinhas cinza e uma verde-limão (hoje).
const PRETO = hex("#111111");
const LIMA = hex("#d4f55a");
const CINZA = hex("#d6d6d0");
const PONTOS = [CINZA, CINZA, LIMA, CINZA, CINZA, CINZA];

function fundo() {
  return PRETO;
}
// Retângulo arredondado
const dentro = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

/** escala: tamanho do desenho do calendário (menor no ícone "maskable"). */
const icone = (escala) => (x, y) => {
  const u = 0.5 + (x - 0.5) / escala;
  const v = 0.5 + (y - 0.5) / escala;
  // argolas
  for (const ax of [0.36, 0.64]) if (dentro(u, v, ax - 0.035, 0.17, ax + 0.035, 0.32, 0.035)) return BRANCO;
  if (!dentro(u, v, 0.2, 0.24, 0.8, 0.8, 0.09)) return fundo(x, y);
  if (v < 0.4) return LIMA; // faixa do topo
  // grade 3x2 de bolinhas coloridas
  for (let i = 0; i < 6; i++) {
    const px = 0.33 + (i % 3) * 0.17, py = 0.52 + Math.floor(i / 3) * 0.16;
    if ((u - px) ** 2 + (v - py) ** 2 <= 0.052 ** 2) return PONTOS[i];
  }
  return BRANCO;
};

mkdirSync("public/icons", { recursive: true });
const saidas = [
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["apple-touch-icon.png", 180, 1],
  ["maskable-512.png", 512, 0.75],
];
for (const [nome, t, e] of saidas) {
  writeFileSync(`public/icons/${nome}`, png(t, icone(e)));
  console.log("ok", nome);
}
