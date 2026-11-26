// Ramos da Estética e os serviços de cada um.
// Cada profissional escolhe os SEUS ramos (no primeiro acesso ou no Perfil) e, na hora de marcar,
// só aparecem os serviços deles. `duracao` (minutos) já ajusta o horário de fim ao escolher o serviço.
//
// Mudou algum `id`? Atualize também backend/src/categorias.ts (o backend recusa serviços que não conhece).

export type Servico = { id: string; nome: string; cor: string; duracao?: number };
export type Ramo = { id: string; nome: string; emoji: string; cor: string; servicos: Servico[] };

/** Monta os serviços de um ramo com a cor dele e o prefixo do id. */
const ramo = (id: string, nome: string, emoji: string, cor: string, servicos: [string, string, number][]): Ramo => ({
  id,
  nome,
  emoji,
  cor,
  servicos: servicos.map(([sid, snome, duracao]) => ({ id: `${id}_${sid}`, nome: snome, cor, duracao })),
});

export const RAMOS_ESTETICA: Ramo[] = [
  ramo("cilios", "Cílios", "👁️", "uva", [
    ["fio_a_fio", "Fio a fio", 120],
    ["volume_brasileiro", "Volume brasileiro", 150],
    ["volume_russo", "Volume russo", 150],
    ["hibrido", "Volume híbrido", 150],
    ["mega_volume", "Mega volume", 180],
    ["manutencao", "Manutenção de cílios", 90],
    ["lash_lifting", "Lash lifting", 60],
    ["tintura", "Tintura de cílios", 30],
    ["remocao", "Remoção de cílios", 30],
  ]),
  ramo("sobrancelha", "Sobrancelhas", "✨", "tangerina", [
    ["design", "Design", 30],
    ["henna", "Design com henna", 45],
    ["tintura", "Design com tintura", 45],
    ["brow_lamination", "Brow lamination", 60],
    ["micro_fio_a_fio", "Micropigmentação fio a fio", 120],
    ["nanoblading", "Nanoblading", 120],
    ["shadow", "Shadow / microshading", 120],
    ["retoque", "Retoque de sobrancelha", 60],
    ["buco", "Buço (linha/cera)", 15],
  ]),
  ramo("unhas", "Unhas", "💅", "morango", [
    ["manicure", "Manicure", 45],
    ["pedicure", "Pedicure", 60],
    ["mao_e_pe", "Mão e pé", 90],
    ["esmaltacao_gel", "Esmaltação em gel", 60],
    ["alongamento_gel", "Alongamento em gel", 150],
    ["fibra", "Fibra de vidro", 150],
    ["polygel", "Polygel", 120],
    ["banho_gel", "Banho de gel", 90],
    ["manutencao", "Manutenção de unhas", 90],
    ["blindagem", "Blindagem", 60],
    ["spa_pes", "Spa dos pés", 60],
    ["nail_art", "Nail art", 30],
    ["remocao", "Remoção de unhas", 30],
  ]),
  ramo("cabelo", "Cabelo", "💇‍♀️", "chiclete", [
    ["corte_feminino", "Corte feminino", 60],
    ["corte_masculino", "Corte masculino", 30],
    ["escova", "Escova", 45],
    ["coloracao", "Coloração", 120],
    ["mechas", "Mechas / luzes", 180],
    ["progressiva", "Progressiva", 180],
    ["botox", "Botox capilar", 120],
    ["hidratacao", "Hidratação capilar", 60],
    ["penteado", "Penteado", 60],
    ["trancas", "Tranças", 180],
    ["megahair", "Mega hair", 180],
  ]),
  ramo("maquiagem", "Maquiagem", "💄", "manga", [
    ["social", "Social", 60],
    ["noiva", "Noiva", 90],
    ["madrinha", "Madrinha / formanda", 60],
    ["artistica", "Artística", 90],
    ["aula", "Aula de automaquiagem", 120],
  ]),
  ramo("facial", "Estética facial", "🧖‍♀️", "menta", [
    ["limpeza", "Limpeza de pele", 90],
    ["peeling", "Peeling", 60],
    ["microagulhamento", "Microagulhamento", 60],
    ["dermaplaning", "Dermaplaning", 45],
    ["hidratacao", "Hidratação facial", 60],
    ["radiofrequencia", "Radiofrequência", 45],
  ]),
  ramo("depilacao", "Depilação", "🪒", "mirtilo", [
    ["cera", "Cera", 30],
    ["linha", "Linha", 20],
    ["laser", "Laser", 30],
    ["buco", "Buço", 15],
    ["axila", "Axila", 15],
    ["virilha", "Virilha", 30],
    ["perna", "Perna inteira", 45],
  ]),
  ramo("corporal", "Corporal e massagem", "💆‍♀️", "kiwi", [
    ["relaxante", "Massagem relaxante", 60],
    ["drenagem", "Drenagem linfática", 60],
    ["modeladora", "Massagem modeladora", 60],
    ["pedras", "Pedras quentes", 60],
    ["ventosa", "Ventosaterapia", 45],
  ]),
  ramo("micro", "Micropigmentação", "🖋️", "uva", [
    ["labios", "Lábios", 120],
    ["olhos", "Olhos / delineado", 90],
    ["retoque", "Retoque de micro", 60],
  ]),
  ramo("podologia", "Podologia", "🦶", "menta", [
    ["podologia", "Podologia", 60],
    ["encravada", "Unha encravada", 45],
  ]),
];

/** Serviços antigos (antes dos ramos): continuam válidos para compromissos já salvos. */
export const SERVICOS_ANTIGOS: Servico[] = [
  { id: "cabelo", nome: "Cabelo", cor: "chiclete" },
  { id: "unhas", nome: "Unhas", cor: "morango" },
  { id: "sobrancelha", nome: "Sobrancelha", cor: "tangerina" },
  { id: "maquiagem", nome: "Maquiagem", cor: "manga" },
  { id: "pele", nome: "Pele", cor: "menta" },
];
