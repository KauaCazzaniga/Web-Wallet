// Utilitário: transaction
// Responsabilidade: normalização de transações vindas de fontes diferentes (backend, import PDF)
// Depende de: nada

/**
 * Normaliza uma string de data para o formato "YYYY-MM-DD".
 * Aceita ISO strings, objetos Date e strings já no formato correto.
 * @param {string|Date|null} raw
 * @returns {string|null}
 */
export const normalizeDate = (raw) => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw).slice(0, 10);

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Normaliza uma transação de qualquer fonte para o formato interno padrão.
 * Usado em Relatórios e qualquer outro lugar que precisar de formato consistente.
 * @param {object} transaction - transação bruta do backend ou importada
 * @returns {{ id, data, descricao, valor, tipo, categoria }}
 */
export const normalizeTransaction = (transaction) => ({
  id: transaction?._id || transaction?.id || `${transaction?.descricao}-${transaction?.data}`,
  data: normalizeDate(transaction?.data || transaction?.data_hora || transaction?.createdAt || transaction?.date),
  descricao: String(transaction?.descricao || '').trim(),
  valor: Number(transaction?.valor || 0),
  tipo: transaction?.tipo === 'receita' ? 'receita' : 'despesa',
  categoria: transaction?.categoria || 'Outros',
});
