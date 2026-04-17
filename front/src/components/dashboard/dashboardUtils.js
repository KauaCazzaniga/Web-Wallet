// Utilitários compartilhados do Dashboard
// Funções puras, constantes e helpers — sem imports de React

import { resolverGastoFixo } from '../../constants/gastosFixos';

// ── Constantes ────────────────────────────────────────────────
export const ITEMS_POR_PAGINA = 15;

export const EMPTY_RESUMO_MES = {
  saldo_inicial: 0,
  total_receitas: 0,
  total_despesas: 0,
  saldo_atual: 0,
};

export const EMPTY_IMPORT_STATE = {
  banco: null,
  periodo: { inicio: null, fim: null },
  transacoes: [],
  total_transacoes: 0,
  observacoes: null,
};

export const CAT_ICONS = {
  'Alimentação': '🍔',
  'Transporte': '🚗',
  'Lazer': '🎉',
  'Saúde': '💊',
  'Salário': '💰',
  'Outros': '📦',
};
export const CATS = Object.keys(CAT_ICONS);

// ── Formatação ────────────────────────────────────────────────
export const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

export const formatarCompetencia = (comp) => {
  const [y, m] = String(comp).split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const competenciaHoje = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

// ── Datas ─────────────────────────────────────────────────────
export const parseDate = (raw) => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
    const [y, m, d] = String(raw).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d1 = new Date(raw);
  if (!isNaN(d1.getTime())) return d1;
  const parts = String(raw).split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const d2 = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
};

export const getTransactionRawDate = (tx) =>
  tx?.data || tx?.data_hora || tx?.createdAt || tx?.date || tx?.importedAt || null;

export const getTransactionCompetencia = (tx) => {
  if (tx?.competencia) return tx.competencia;
  const raw = String(getTransactionRawDate(tx) || '');
  return raw.length >= 7 ? raw.slice(0, 7) : null;
};

export const sortTransactionsByDateDesc = (a, b) => {
  const ta = parseDate(getTransactionRawDate(a))?.getTime() || 0;
  const tb = parseDate(getTransactionRawDate(b))?.getTime() || 0;
  return tb - ta;
};

// ── Categoria ─────────────────────────────────────────────────
export const resolveCatDisplay = (cat) => {
  const fixo = resolverGastoFixo(cat);
  if (fixo) return { label: fixo.label, icon: fixo.icon };
  return { label: cat, icon: CAT_ICONS[cat] || '📦' };
};
