const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const shortMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
});

const longMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

const roundTo = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
};

const toMonthDate = (value) => {
  const safeValue = String(value || '').slice(0, 7);
  const [year, month] = safeValue.split('-').map(Number);

  if (!year || !month) return null;

  return new Date(year, month - 1, 1);
};

const toMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonthShort = (monthKey) => {
  const date = toMonthDate(monthKey);
  if (!date) return '—';

  return shortMonthFormatter
    .format(date)
    .replace('.', '')
    .replace(/\s/g, '/')
    .replace(/^./, (letter) => letter.toUpperCase());
};

const formatMonthLong = (monthKey) => {
  const date = toMonthDate(monthKey);
  if (!date) return '—';

  const formatted = longMonthFormatter.format(date);
  return formatted.replace(/^./, (letter) => letter.toUpperCase());
};

export const formatCurrencyBRL = (value) => currencyFormatter.format(roundTo(value));

export const formatCompactCurrency = (value) => {
  const numeric = roundTo(value);
  const absolute = Math.abs(numeric);

  if (absolute < 1000) return formatCurrencyBRL(numeric);

  const compact = roundTo(numeric / 1000, absolute >= 10000 ? 0 : 1)
    .toFixed(absolute >= 10000 ? 0 : 1)
    .replace('.', ',');

  return `R$ ${compact}k`;
};

export const getCurrentMonthKey = () => {
  const now = new Date();
  return toMonthKey(new Date(now.getFullYear(), now.getMonth(), 1));
};

export const shiftMonthKey = (monthKey, offset) => {
  const date = toMonthDate(monthKey);
  if (!date) return getCurrentMonthKey();

  const shifted = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return toMonthKey(shifted);
};

export const getDefaultReportRange = () => {
  const fim = getCurrentMonthKey();
  const inicio = shiftMonthKey(fim, -5);
  return { inicio, fim };
};

export const listMonthsBetween = (start, end) => {
  const startDate = toMonthDate(start);
  const endDate = toMonthDate(end);

  if (!startDate || !endDate) return [];

  const safeStart = startDate <= endDate ? startDate : endDate;
  const safeEnd = startDate <= endDate ? endDate : startDate;
  const months = [];

  for (
    let cursor = new Date(safeStart.getFullYear(), safeStart.getMonth(), 1);
    cursor <= safeEnd;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  ) {
    months.push(toMonthKey(cursor));
  }

  return months;
};

const getVariation = (currentValue, previousValue) => {
  if (previousValue == null || previousValue === 0) return null;

  return roundTo(((currentValue - previousValue) / previousValue) * 100, 1);
};

export const processarMeses = (transacoes = [], dataInicio, dataFim) => {
  const meses = listMonthsBetween(dataInicio, dataFim);
  const agregados = new Map();

  meses.forEach((mes) => {
    agregados.set(mes, {
      mes,
      label: formatMonthShort(mes),
      labelCompleto: formatMonthLong(mes),
      receita: 0,
      despesa: 0,
      saldo: 0,
      saldoAcumulado: 0,
      varReceita: null,
      varDespesa: null,
      mesAnteriorLabel: null,
    });
  });

  transacoes.forEach((transacao) => {
    const rawDate = String(transacao?.data || '').slice(0, 10);
    const monthKey = rawDate.slice(0, 7);
    const valor = roundTo(transacao?.valor || 0);

    if (!agregados.has(monthKey) || !transacao?.tipo) return;

    const item = agregados.get(monthKey);
    if (transacao.tipo === 'receita') item.receita = roundTo(item.receita + valor);
    if (transacao.tipo === 'despesa') item.despesa = roundTo(item.despesa + valor);
  });

  const lista = Array.from(agregados.values()).sort((left, right) => left.mes.localeCompare(right.mes));
  let saldoAcumulado = 0;

  return lista.map((item, index) => {
    const anterior = index > 0 ? lista[index - 1] : null;
    const saldo = roundTo(item.receita - item.despesa);
    saldoAcumulado = roundTo(saldoAcumulado + saldo);

    return {
      ...item,
      saldo,
      saldoAcumulado,
      varReceita: anterior ? getVariation(item.receita, anterior.receita) : null,
      varDespesa: anterior ? getVariation(item.despesa, anterior.despesa) : null,
      mesAnteriorLabel: anterior ? anterior.label : null,
    };
  });
};
