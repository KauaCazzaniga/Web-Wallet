// Hook: useTransactions
// Responsabilidade: gerencia estado, fetch e CRUD de transações do mês selecionado
// Depende de: api, dashboardUtils

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import {
  EMPTY_RESUMO_MES,
  competenciaHoje,
  getTransactionCompetencia,
  sortTransactionsByDateDesc,
} from '../components/dashboard/dashboardUtils';

/**
 * @param {string} mesSelecionado - "YYYY-MM" do mês ativo
 * @param {{ notify: Function, onMesesChanged: Function }} opts
 * @returns {{ transactions, transacoesMes, resumoMes, initialLoading, loadingMes,
 *             saving, delConfirm, fetchMesSelecionado,
 *             addTransaction, requestDelete, cancelDelete, confirmDelete,
 *             requestDeleteAll, confirmDeleteAll }}
 */
export function useTransactions(mesSelecionado, { notify, onMesesChanged }) {
  const [transactions, setTransactions] = useState([]);
  const [resumoMes, setResumoMes] = useState(EMPTY_RESUMO_MES);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMes, setLoadingMes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, mode: 'single', id: null, count: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMesSelecionado = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingMes(true);
    try {
      const { data } = await api.get(`/wallet/extrato/${mesSelecionado}`);
      setTransactions((data?.transacoes || []).filter(tx => !tx.deletadoEm));
      setResumoMes(data?.resumo || EMPTY_RESUMO_MES);
    } catch (err) {
      if (err?.response?.status === 404) {
        setTransactions([]);
        setResumoMes(EMPTY_RESUMO_MES);
      } else {
        notify('Não foi possível carregar os dados', 'error');
      }
    } finally {
      setInitialLoading(false);
      if (!silent) setLoadingMes(false);
    }
  }, [mesSelecionado, notify]);

  useEffect(() => { fetchMesSelecionado(); }, [fetchMesSelecionado]);

  // ── Derivados ──────────────────────────────────────────────────────────────

  const transacoesMes = useMemo(
    () => [...transactions].sort(sortTransactionsByDateDesc),
    [transactions],
  );

  // ── Adicionar ──────────────────────────────────────────────────────────────

  /**
   * Envia uma transação para a API. Retorna true em caso de sucesso.
   * @param {{ tipo, valor, descricao, categoria }} form
   */
  const addTransaction = useCallback(async (form) => {
    setSaving(true);
    try {
      await api.post('/wallet/transacao', {
        ...form,
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        competencia: mesSelecionado || competenciaHoje(),
      });
      await fetchMesSelecionado({ silent: true });
      onMesesChanged();
      notify('Transação registrada!');
      return true;
    } catch {
      notify('Erro ao salvar transação', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [mesSelecionado, notify, onMesesChanged, fetchMesSelecionado]);

  // ── Deletar simples ────────────────────────────────────────────────────────

  const requestDelete = useCallback((tx) => {
    setDelConfirm({ open: true, mode: 'single', id: tx?._id, count: 1 });
  }, []);

  const cancelDelete = useCallback(() => {
    setDelConfirm({ open: false, mode: 'single', id: null, count: 0 });
  }, []);

  const confirmDelete = useCallback(async () => {
    const id = delConfirm.id;
    const txToDelete = transactions.find(tx => tx._id === id);
    setTransactions(prev => prev.filter(tx => tx._id !== id));
    setDelConfirm({ open: false, mode: 'single', id: null, count: 0 });
    try {
      await api.delete(`/wallet/transacao/${id}`, {
        data: { competencia: getTransactionCompetencia(txToDelete) || mesSelecionado || competenciaHoje() },
      });
      await fetchMesSelecionado({ silent: true });
      notify('Transação removida!');
    } catch {
      // Reverte o estado otimista via re-fetch e informa o erro
      await fetchMesSelecionado({ silent: true });
      notify('Erro ao excluir — recarregue a página', 'error');
    }
  }, [delConfirm.id, transactions, mesSelecionado, notify, fetchMesSelecionado]);

  // ── Deletar em massa ───────────────────────────────────────────────────────

  const requestDeleteAll = useCallback(() => {
    if (!transacoesMes.length) {
      notify('Não há transações para excluir neste mês', 'error');
      return;
    }
    setDelConfirm({ open: true, mode: 'all', id: null, count: transacoesMes.length });
  }, [transacoesMes, notify]);

  const confirmDeleteAll = useCallback(async () => {
    const quantidadeAtual = transacoesMes.length;
    const transacoesParaExcluir = [...transacoesMes];
    setTransactions([]);
    setDelConfirm({ open: false, mode: 'single', id: null, count: 0 });
    try {
      let removidas = 0;
      try {
        const { data } = await api.delete(`/wallet/${mesSelecionado}/transacoes`);
        removidas = Number(data?.removidas || quantidadeAtual);
      } catch (bulkError) {
        if (bulkError?.response?.status !== 404) throw bulkError;
        const resultados = await Promise.allSettled(
          transacoesParaExcluir.map(tx => {
            const comp = getTransactionCompetencia(tx) || mesSelecionado || competenciaHoje();
            return api.delete(`/wallet/${comp}/transacao/${tx._id}`);
          }),
        );
        removidas = resultados.filter(r => r.status === 'fulfilled').length;
        if (!removidas) throw bulkError;
      }
      await fetchMesSelecionado({ silent: true });
      notify(`${removidas || quantidadeAtual} transações removidas!`);
    } catch {
      notify('Erro ao excluir transações — recarregue a página', 'error');
      await fetchMesSelecionado({ silent: true });
    }
  }, [transacoesMes, mesSelecionado, notify, fetchMesSelecionado]);

  return {
    transactions,
    transacoesMes,
    resumoMes,
    initialLoading,
    loadingMes,
    saving,
    delConfirm,
    fetchMesSelecionado,
    addTransaction,
    requestDelete,
    cancelDelete,
    confirmDelete,
    requestDeleteAll,
    confirmDeleteAll,
  };
}
