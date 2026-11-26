// Regras de cada agenda. Os nomes e cores ficam no frontend; aqui só o que valida os dados.

export const CATEGORIAS = {
  trabalho: {
    tipos: ["reuniao", "tarefa", "prazo", "visita", "outro"],
    status: ["marcado", "feito", "cancelado"],
  },
  musico: {
    tipos: ["show", "casamento", "corporativo", "festa", "ensaio", "aula", "gravacao", "outro"],
    status: ["marcado", "confirmado", "pago", "cancelado"],
  },
  estetica: {
    // Serviços de todos os ramos (cílios, sobrancelhas, unhas…). Espelha frontend/src/lib/ramosEstetica.ts:
    // os ids lá são "<ramo>_<serviço>". Os que saíram da lista (sem prefixo, híbrido, mega volume…) ficam para os dados já salvos.
    tipos: [
      "cilios_fio_a_fio", "cilios_volume_brasileiro", "cilios_volume_egipcio", "cilios_volume_russo",
      "cilios_volume_luxo", "cilios_fox_eyes", "cilios_manutencao", "cilios_lash_lifting",
      "cilios_tintura", "cilios_remocao", "sobrancelha_design", "sobrancelha_henna",
      "sobrancelha_tintura", "sobrancelha_brow_lamination", "sobrancelha_nanoblading",
      "sobrancelha_shadow", "sobrancelha_retoque", "sobrancelha_buco", "unhas_manicure",
      "unhas_pedicure", "unhas_mao_e_pe", "unhas_esmaltacao_gel", "unhas_alongamento_gel",
      "unhas_fibra", "unhas_mold_f1", "unhas_polygel", "unhas_banho_gel", "unhas_manutencao",
      "unhas_blindagem", "unhas_spa_pes", "unhas_nail_art", "unhas_remocao", "cabelo_corte_feminino",
      "cabelo_corte_masculino", "cabelo_escova", "cabelo_coloracao", "cabelo_mechas",
      "cabelo_progressiva", "cabelo_botox", "cabelo_hidratacao", "cabelo_penteado", "cabelo_trancas",
      "cabelo_megahair", "maquiagem_social", "maquiagem_noiva", "maquiagem_madrinha",
      "maquiagem_artistica", "maquiagem_aula", "facial_limpeza", "facial_peeling",
      "facial_microagulhamento", "facial_dermaplaning", "facial_hidratacao",
      "facial_radiofrequencia", "depilacao_cera", "depilacao_linha", "depilacao_laser",
      "depilacao_buco", "depilacao_axila", "depilacao_virilha", "depilacao_perna",
      "corporal_relaxante", "corporal_drenagem", "corporal_modeladora", "corporal_pedras",
      "corporal_ventosa", "micro_labios", "micro_olhos", "micro_retoque", "podologia_podologia",
      "podologia_encravada", "cilios_hibrido", "cilios_mega_volume", "sobrancelha_micro_fio_a_fio",
      "cabelo", "unhas", "sobrancelha", "maquiagem", "pele", "outro"
    ],
    status: ["marcado", "confirmado", "pago", "cancelado"],
  },
} as const;

export type CategoriaId = keyof typeof CATEGORIAS;
export const IDS_CATEGORIAS = Object.keys(CATEGORIAS) as [CategoriaId, ...CategoriaId[]];
