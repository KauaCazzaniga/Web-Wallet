// Serviço: investments
// Responsabilidade: wrapper axios para os endpoints de investimentos e cofrinhos.
//   Normaliza os campos da API para o formato usado nos componentes.
// Depende de: api.js (instância axios com JWT)

import api from './api';

// ─────────────────────────────────────────────────────────────
// NORMALIZAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * A API retorna { valorMeta, valorAtual, progresso, concluido }.
 * O componente usa { meta, atual } — normaliza aqui para não vazar
 * a nomenclatura interna do backend para dentro dos componentes.
 * @param {object} goal - resposta bruta da API
 * @returns {object}
 */
const normalizarCofrinho = (goal) => ({
  id:        goal.id,
  nome:      goal.nome,
  icone:     goal.icone,
  cor:       goal.cor,
  meta:      goal.valorMeta,
  atual:     goal.valorAtual,
  prazo:     goal.prazo ?? null,
  progresso: goal.progresso,
  concluido: goal.concluido,
});

// ─────────────────────────────────────────────────────────────
// INVESTIMENTOS
// ─────────────────────────────────────────────────────────────

/**
 * Lista todos os investimentos ativos do usuário.
 * @returns {Promise<{ investimentos: object[], resumo: object }>}
 */
export const listarInvestimentos = async () => {
  const { data } = await api.get('/investments');
  return data;
};

/**
 * Cria um novo investimento.
 * @param {{ tipo, nome, taxa, valor, rendimento, mesInicio }} payload
 * @returns {Promise<object>} investimento criado
 */
export const criarInvestimento = async (payload) => {
  const { data } = await api.post('/investments', payload);
  return data.investimento;
};

/**
 * Atualiza campos de um investimento (partial update).
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} investimento atualizado
 */
export const atualizarInvestimento = async (id, payload) => {
  const { data } = await api.put(`/investments/${id}`, payload);
  return data.investimento;
};

/**
 * Remove (soft-delete) um investimento.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const removerInvestimento = async (id) => {
  await api.delete(`/investments/${id}`);
};

// ─────────────────────────────────────────────────────────────
// COFRINHOS
// ─────────────────────────────────────────────────────────────

/**
 * Lista todos os cofrinhos ativos do usuário.
 * @returns {Promise<{ cofrinhos: object[], resumo: object }>}
 */
export const listarCofrinhos = async () => {
  const { data } = await api.get('/investments/goals');
  return {
    cofrinhos: data.cofrinhos.map(normalizarCofrinho),
    resumo: data.resumo,
  };
};

/**
 * Cria um novo cofrinho.
 * @param {{ nome, icone, cor, valorMeta, prazo }} payload
 * @returns {Promise<object>} cofrinho criado (normalizado)
 */
export const criarCofrinho = async (payload) => {
  const { data } = await api.post('/investments/goals', {
    ...payload,
    valorMeta: payload.meta ?? payload.valorMeta,
  });
  return normalizarCofrinho(data.cofrinho);
};

/**
 * Atualiza metadados de um cofrinho.
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} cofrinho atualizado (normalizado)
 */
export const atualizarCofrinho = async (id, payload) => {
  const { data } = await api.put(`/investments/goals/${id}`, {
    ...payload,
    valorMeta: payload.meta ?? payload.valorMeta,
  });
  return normalizarCofrinho(data.cofrinho);
};

/**
 * Deposita ou retira valor de um cofrinho.
 * Valor positivo = depósito. Valor negativo = retirada.
 * @param {string} id
 * @param {number} valor
 * @returns {Promise<object>} cofrinho atualizado (normalizado)
 */
export const depositarCofrinho = async (id, valor) => {
  const { data } = await api.patch(`/investments/goals/${id}/depositar`, { valor });
  return normalizarCofrinho(data.cofrinho);
};

/**
 * Remove (soft-delete) um cofrinho.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const removerCofrinho = async (id) => {
  await api.delete(`/investments/goals/${id}`);
};
