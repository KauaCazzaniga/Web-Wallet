/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const LEGACY_IMPORTS_PREFIX = '@WebWallet:imports:';
const INVESTMENTS_STORAGE_KEY = 'webwallet_investimentos';
const HIGHLIGHT_DURATION = 3000;

const METAS_KEY    = (uk) => `webwallet_metas:${uk}`;
const GF_METAS_KEY = (uk) => `webwallet_gastos_fixos_metas:${uk}`;

const toLegacyImportsKey = (userKey) => `${LEGACY_IMPORTS_PREFIX}${String(userKey || 'anon').replace(/[^\w@.-]/g, '_')}`;

export const FinanceContext = createContext(null);

export const FinanceProvider = ({ children, userKey }) => {
  const legacyImportsKey = useMemo(() => toLegacyImportsKey(userKey), [userKey]);
  const [investimentos, setInvestimentos] = useState([]);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [legacyImportedTransactions, setLegacyImportedTransactions] = useState([]);
  const [investimentosHydrated, setInvestimentosHydrated] = useState(false);
  const [metas, setMetas] = useState({});
  const [gastosFixosMetas, setGastosFixosMetas] = useState({});
  const [metasHydrated, setMetasHydrated] = useState(false);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(legacyImportsKey);
      setLegacyImportedTransactions(raw ? JSON.parse(raw) : []);
    } catch {
      setLegacyImportedTransactions([]);
    }
  }, [legacyImportsKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INVESTMENTS_STORAGE_KEY);
      setInvestimentos(raw ? JSON.parse(raw) : []);
    } catch {
      setInvestimentos([]);
    } finally {
      setInvestimentosHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!investimentosHydrated) return;
    localStorage.setItem(INVESTMENTS_STORAGE_KEY, JSON.stringify(investimentos));
  }, [investimentos, investimentosHydrated]);

  useEffect(() => {
    try {
      const m  = localStorage.getItem(METAS_KEY(userKey));
      const gf = localStorage.getItem(GF_METAS_KEY(userKey));
      setMetas(m  ? JSON.parse(m)  : {});
      setGastosFixosMetas(gf ? JSON.parse(gf) : {});
    } catch {
      setMetas({});
      setGastosFixosMetas({});
    } finally {
      setMetasHydrated(true);
    }
  }, [userKey]);

  useEffect(() => {
    if (!metasHydrated) return;
    localStorage.setItem(METAS_KEY(userKey), JSON.stringify(metas));
  }, [metas, metasHydrated, userKey]);

  useEffect(() => {
    if (!metasHydrated) return;
    localStorage.setItem(GF_METAS_KEY(userKey), JSON.stringify(gastosFixosMetas));
  }, [gastosFixosMetas, metasHydrated, userKey]);

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

  const importTransactionsBatch = useCallback(async (transactions = []) => {
    const ids = transactions
      .map((transaction) => transaction?._id)
      .filter(Boolean);

    ativarDestaques(ids);
    return transactions;
  }, []);

  const adicionarAporte = useCallback((mes, valor, descricao = '') => {
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
  }, [investimentos]);

  const clearLegacyImportedTransactions = useCallback(() => {
    setLegacyImportedTransactions([]);
    try {
      localStorage.removeItem(legacyImportsKey);
    } catch {
      // Ignora falha ao limpar o legado local.
    }
  }, [legacyImportsKey]);

  const salvarMetas = useCallback((novasMetas, novosGfMetas) => {
    if (novasMetas    !== undefined) setMetas(novasMetas);
    if (novosGfMetas  !== undefined) setGastosFixosMetas(novosGfMetas);
  }, []);

  // TODO: editarAporte, removerAporte → será usado em Relatorios.jsx

  const value = useMemo(() => ({
    investimentos,
    highlightedIds,
    legacyImportedTransactions,
    metas,
    gastosFixosMetas,
    salvarMetas,
    importTransactionsBatch,
    adicionarAporte,
    clearLegacyImportedTransactions,
  }), [adicionarAporte, clearLegacyImportedTransactions, gastosFixosMetas, highlightedIds, importTransactionsBatch, investimentos, legacyImportedTransactions, metas, salvarMetas]);

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
