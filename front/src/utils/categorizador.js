export const CATEGORIAS_IMPORTACAO = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Moradia',
  'Saúde',
  'Salário',
  'Investimentos',
  'Outros',
  // Gastos Fixos (subcategorias)
  'gastos_fixos.aluguel',
  'gastos_fixos.energia',
  'gastos_fixos.agua',
  'gastos_fixos.internet',
  'gastos_fixos.celular',
  'gastos_fixos.gas',
  'gastos_fixos.streaming',
  'gastos_fixos.planoSaude',
  'gastos_fixos.seguroCarro',
  'gastos_fixos.condominio',
];

const REGRAS = [
  // Gastos fixos (mais específicos primeiro para evitar conflito com Moradia/Lazer)
  { categoria: 'gastos_fixos.aluguel', termos: ['aluguel', 'financiamento imovel', 'financiamento imóvel', 'prestacao imovel', 'prestação imóvel'] },
  { categoria: 'gastos_fixos.energia', termos: ['energia eletrica', 'energia elétrica', 'conta de luz', 'cpfl', 'enel', 'cemig', 'celesc', 'copel', 'light'] },
  { categoria: 'gastos_fixos.agua', termos: ['agua e esgoto', 'água e esgoto', 'saneamento', 'sabesp', 'copasa', 'casan', 'embasa'] },
  { categoria: 'gastos_fixos.internet', termos: ['internet', 'fibra', 'banda larga', 'provedor'] },
  { categoria: 'gastos_fixos.celular', termos: ['celular', 'telefone', 'vivo', 'claro', 'tim', 'oi movel', 'oi móvel'] },
  { categoria: 'gastos_fixos.gas', termos: ['gas encanado', 'gás encanado', 'gas natural', 'gás natural', 'ultragaz', 'supergasbras', 'botijao', 'botijão', 'comgas', 'comgás'] },
  { categoria: 'gastos_fixos.streaming', termos: ['netflix', 'spotify', 'disney', 'hbo', 'prime video', 'amazon prime', 'deezer', 'youtube premium', 'apple tv', 'globoplay', 'paramount'] },
  { categoria: 'gastos_fixos.planoSaude', termos: ['plano de saude', 'plano de saúde', 'unimed', 'amil', 'bradesco saude', 'bradesco saúde', 'sulamerica', 'sulamérica', 'hapvida', 'notre dame'] },
  { categoria: 'gastos_fixos.seguroCarro', termos: ['seguro auto', 'seguro carro', 'seguro veiculo', 'seguro veículo', 'porto seguro', 'tokio marine', 'azul seguros', 'hdi seguros'] },
  { categoria: 'gastos_fixos.condominio', termos: ['condominio', 'condomínio', 'taxa condominial'] },
  // Categorias gerais
  { categoria: 'Transporte', termos: ['uber', '99', 'combustivel', 'combustível', 'posto'] },
  { categoria: 'Alimentação', termos: ['restaurante', 'ifood', 'mercado', 'supermercado', 'padaria'] },
  { categoria: 'Lazer', termos: ['cinema', 'steam', 'game'] },
  { categoria: 'Moradia', termos: ['iptu'] },
  { categoria: 'Saúde', termos: ['farmacia', 'farmácia', 'hospital', 'medico', 'médico'] },
  { categoria: 'Salário', termos: ['salario', 'salário', 'holerite', 'pagamento empresa'] },
];

const removerAcentos = (texto = '') =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizarDescricao = (descricao = '') =>
  removerAcentos(String(descricao || ''))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const sugerirCategoria = (descricao = '') => {
  const texto = normalizarDescricao(descricao);

  const match = REGRAS.find((regra) =>
    regra.termos.some((termo) => texto.includes(normalizarDescricao(termo))),
  );

  return match?.categoria || 'Outros';
};

export const gerarChaveTransacao = ({ data, valor, descricao }) => {
  const dataNormalizada = String(data || '').slice(0, 10);
  const valorNormalizado = Number(Math.abs(Number(valor || 0))).toFixed(2);
  const descricaoNormalizada = normalizarDescricao(descricao);

  return `${dataNormalizada}::${valorNormalizado}::${descricaoNormalizada}`;
};

export const prepararTransacoesImportadas = (transacoes = []) =>
  transacoes
    .filter((transacao) => transacao?.data && transacao?.descricao && Number.isFinite(Number(transacao?.valor)))
    .map((transacao, index) => ({
      idLocal: `parsed-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      data: String(transacao.data).slice(0, 10),
      descricao: String(transacao.descricao || '').trim(),
      valor: Math.abs(Number(transacao.valor || 0)),
      tipo: transacao.tipo === 'receita' ? 'receita' : 'despesa',
      valor_original: String(transacao.valor_original || '').trim(),
      categoria: sugerirCategoria(transacao.descricao),
      incluir: true,
      duplicada: false,
      avisoDuplicata: null,
    }));
