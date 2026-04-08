/** Prefixo usado para identificar subcategorias de gastos fixos nas transações */
export const GASTOS_FIXOS_PREFIX = 'gastos_fixos.';

/** Subcategorias de gastos fixos (padrão brasileiro) */
export const GASTOS_FIXOS = [
  { key: 'aluguel',     label: 'Aluguel / Financiamento', icon: '🏠' },
  { key: 'energia',     label: 'Energia elétrica',        icon: '💡' },
  { key: 'agua',        label: 'Água e esgoto',           icon: '💧' },
  { key: 'internet',    label: 'Internet',                icon: '📶' },
  { key: 'celular',     label: 'Celular',                 icon: '📱' },
  { key: 'gas',         label: 'Gás',                     icon: '🔥' },
  { key: 'streaming',   label: 'Streaming',               icon: '📺' },
  { key: 'cartaoCredito', label: 'Cartão de crédito',       icon: '💳' },
  { key: 'assinaturasIA', label: 'Assinaturas de IA',       icon: '🤖' },
  { key: 'planoSaude',  label: 'Plano de saúde',          icon: '🏥' },
  { key: 'seguroCarro', label: 'Seguro do carro',         icon: '🚗' },
  { key: 'condominio',  label: 'Condomínio',              icon: '📦' },
];

/** Mapa rápido key → item completo */
export const GASTOS_FIXOS_MAP = Object.fromEntries(
  GASTOS_FIXOS.map((item) => [item.key, item]),
);

/**
 * Dado uma categoria salva na transação (ex: "gastos_fixos.aluguel"),
 * retorna { key, label, icon } ou null se não for gasto fixo.
 */
export const resolverGastoFixo = (categoria) => {
  if (!categoria || !String(categoria).startsWith(GASTOS_FIXOS_PREFIX)) return null;
  const key = String(categoria).slice(GASTOS_FIXOS_PREFIX.length);
  return GASTOS_FIXOS_MAP[key] || null;
};

/**
 * Retorna o label legível de qualquer categoria (normal ou gasto fixo).
 */
export const labelCategoria = (categoria) => {
  const fixo = resolverGastoFixo(categoria);
  return fixo ? fixo.label : categoria;
};

/**
 * Retorna o ícone de qualquer categoria (normal ou gasto fixo).
 * Recebe fallbackIcons como map das categorias normais.
 */
export const iconeCategoria = (categoria, fallbackIcons = {}) => {
  const fixo = resolverGastoFixo(categoria);
  return fixo ? fixo.icon : (fallbackIcons[categoria] || '📦');
};
