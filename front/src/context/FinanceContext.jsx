import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = '@WebWallet:imports:';
const INVESTMENTS_STORAGE_KEY = 'webwallet_investimentos';
const HIGHLIGHT_DURATION = 3000;

const sortByDateDesc = (a, b) => {
  const aValue = new Date(a?.data || a?.importedAt || 0).getTime();
  const bValue = new Date(b?.data || b?.importedAt || 0).getTime();
  return bValue - aValue;
};

const toStorageKey = (userKey) => `${STORAGE_PREFIX}${String(userKey || 'anon').replace(/[^\w@.-]/g, '_')}`;

const resolveCompetencia = (transacao) =>
  transacao?.competencia || (transacao?.data ? String(transacao.data).slice(0, 7) : null);

const createId = (index) => `imp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export const FinanceContext = createContext(null);

export const FinanceProvider = ({ children, userKey }) => {
  const storageKey = useMemo(() => toStorageKey(userKey), [userKey]);
  const [importedTransactions, setImportedTransactions] = useState([]);
  const [investimentos, setInvestimentos] = useState([]);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [investimentosHydrated, setInvestimentosHydrated] = useState(false);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setImportedTransactions(raw ? JSON.parse(raw) : []);
    } catch (error) {
      setImportedTransactions([]);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(importedTransactions));
  }, [hydrated, importedTransactions, storageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INVESTMENTS_STORAGE_KEY);
      setInvestimentos(raw ? JSON.parse(raw) : []);
    } catch (error) {
      setInvestimentos([]);
    } finally {
      setInvestimentosHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!investimentosHydrated) return;
    localStorage.setItem(INVESTMENTS_STORAGE_KEY, JSON.stringify(investimentos));
  }, [investimentos, investimentosHydrated]);

  useEffect(() => () => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
  }, []);

  const ativarDestaques = (ids) => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setHighlightedIds(ids);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedIds([]);
    }, HIGHLIGHT_DURATION);
  };

  const importTransactionsBatch = async (transactions = []) => {
    const stamped = transactions.map((transaction, index) => ({
      ...transaction,
      _id: transaction._id || createId(index),
      isImported: true,
      competencia: resolveCompetencia(transaction),
      importedAt: new Date().toISOString(),
    }));

    setImportedTransactions((current) => [...stamped, ...current].sort(sortByDateDesc));
    ativarDestaques(stamped.map((transaction) => transaction._id));

    return stamped;
  };

  const removeImportedTransaction = (transactionId) => {
    setImportedTransactions((current) => current.filter((transaction) => transaction._id !== transactionId));
    setHighlightedIds((current) => current.filter((id) => id !== transactionId));
  };

  const adicionarAporte = (mes, valor, descricao = '') => {
    const mesNormalizado = String(mes || '').slice(0, 7);
    const valorNumerico = Number(valor || 0);

    if (!/^\d{4}-\d{2}$/.test(mesNormalizado)) {
      throw new Error('Informe um mês válido para o aporte.');
    }

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      throw new Error('Informe um valor válido para o aporte.');
    }

    if (investimentos.some((investimento) => investimento.mes === mesNormalizado)) {
      throw new Error('Já existe um aporte registrado para este mês.');
    }

    const novoAporte = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mes: mesNormalizado,
      valor: valorNumerico,
      descricao: String(descricao || '').trim(),
    };

    setInvestimentos((current) => [...current, novoAporte].sort((a, b) => b.mes.localeCompare(a.mes)));

    return novoAporte;
  };

  // TODO: editarAporte, removerAporte → será usado em Relatorios.jsx

  const value = useMemo(() => ({
    importedTransactions,
    investimentos,
    highlightedIds,
    importTransactionsBatch,
    removeImportedTransaction,
    adicionarAporte,
  }), [highlightedIds, importedTransactions, investimentos]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance precisa ser usado dentro de FinanceProvider.');
  }

  return context;
};
