/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CAT_ICONS, CATS as ALL_CATS } from '../components/dashboard/dashboardUtils';
import { GASTOS_FIXOS } from '../constants/gastosFixos';

const LEGACY_IMPORTS_PREFIX   = '@WebWallet:imports:';
const INVESTMENTS_STORAGE_KEY = 'webwallet_investimentos';
const HIGHLIGHT_DURATION      = 3000;
const toImportKeysKey = (userKey) => `@WebWallet:import-keys:${String(userKey || 'anon').replace(/[^\w@.-]/g, '_')}`;

const METAS_KEY       = (uk) => `webwallet_metas:${uk}`;
const GF_METAS_KEY    = (uk) => `webwallet_gastos_fixos_metas:${uk}`;
const HIDDEN_CATS_KEY = (uk) => `webwallet_hidden_cats:${uk}`;
const HIDDEN_GF_KEY   = (uk) => `webwallet_hidden_gf:${uk}`;

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
  const [hiddenCatLabels, setHiddenCatLabelsRaw] = useState([]);
  const [hiddenGfKeys, setHiddenGfKeysRaw] = useState([]);
  const [hiddenHydrated, setHiddenHydrated] = useState(false);
  const [importedKeys, setImportedKeys] = useState(() => new Set());
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
    try {
      const hc = localStorage.getItem(HIDDEN_CATS_KEY(userKey));
      const hg = localStorage.getItem(HIDDEN_GF_KEY(userKey));
      setHiddenCatLabelsRaw(hc ? JSON.parse(hc) : []);
      setHiddenGfKeysRaw(hg ? JSON.parse(hg) : []);
    } catch {
      setHiddenCatLabelsRaw([]);
      setHiddenGfKeysRaw([]);
    } finally {
      setHiddenHydrated(true);
    }
  }, [userKey]);

  useEffect(() => {
    if (!hiddenHydrated) return;
    localStorage.setItem(HIDDEN_CATS_KEY(userKey), JSON.stringify(hiddenCatLabels));
  }, [hiddenCatLabels, hiddenHydrated, userKey]);

  useEffect(() => {
    if (!hiddenHydrated) return;
    localStorage.setItem(HIDDEN_GF_KEY(userKey), JSON.stringify(hiddenGfKeys));
  }, [hiddenGfKeys, hiddenHydrated, userKey]);

  useEffect(() => {
    if (!metasHydrated) return;
    localStorage.setItem(METAS_KEY(userKey), JSON.stringify(metas));
  }, [metas, metasHydrated, userKey]);

  useEffect(() => {
    if (!metasHydrated) return;
    localStorage.setItem(GF_METAS_KEY(userKey), JSON.stringify(gastosFixosMetas));
  }, [gastosFixosMetas, metasHydrated, userKey]);

  // ── Import keys (deduplicação persistida) ────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(toImportKeysKey(userKey));
      setImportedKeys(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setImportedKeys(new Set());
    }
  }, [userKey]);

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

  /**
   * Persiste um conjunto de chaves de transações já importadas no localStorage.
   * Usado para deduplicação cross-session ao re-importar o mesmo extrato.
   * @param {string[]} keys - chaves geradas por gerarChaveTransacao()
   */
  const addImportedKeys = useCallback((keys = []) => {
    setImportedKeys((current) => {
      const next = new Set(current);
      keys.forEach((k) => next.add(k));
      try {
        localStorage.setItem(toImportKeysKey(userKey), JSON.stringify([...next]));
      } catch {
        // Ignora falha de escrita no localStorage
      }
      return next;
    });
  }, [userKey]);

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

  const setHiddenCatLabels = useCallback((updated) => setHiddenCatLabelsRaw(updated), []);
  const setHiddenGfKeys    = useCallback((updated) => setHiddenGfKeysRaw(updated), []);

  const visibleCatIcons = useMemo(() =>
    Object.fromEntries(Object.entries(CAT_ICONS).filter(([k]) => !hiddenCatLabels.includes(k))),
  [hiddenCatLabels]);

  const visibleCats = useMemo(() => ALL_CATS.filter(c => !hiddenCatLabels.includes(c)), [hiddenCatLabels]);

  const visibleGastosFix = useMemo(() =>
    GASTOS_FIXOS.filter(gf => !hiddenGfKeys.includes(gf.key)),
  [hiddenGfKeys]);

  const editarAporte = useCallback((id, { valor, descricao } = {}) => {
    const valorNumerico = Number(valor || 0);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      throw new Error('Informe um valor válido para o aporte.');
    }

    setInvestimentos((current) =>
      current.map((inv) =>
        inv.id === id
          ? { ...inv, valor: valorNumerico, descricao: String(descricao || '').trim() }
          : inv,
      ),
    );
  }, []);

  const removerAporte = useCallback((id) => {
    setInvestimentos((current) => current.filter((inv) => inv.id !== id));
  }, []);

  const value = useMemo(() => ({
    investimentos,
    highlightedIds,
    legacyImportedTransactions,
    importedKeys,
    metas,
    gastosFixosMetas,
    salvarMetas,
    importTransactionsBatch,
    addImportedKeys,
    adicionarAporte,
    editarAporte,
    removerAporte,
    clearLegacyImportedTransactions,
    hiddenCatLabels,
    hiddenGfKeys,
    setHiddenCatLabels,
    setHiddenGfKeys,
    visibleCatIcons,
    visibleCats,
    visibleGastosFix,
  }), [
    adicionarAporte, addImportedKeys, clearLegacyImportedTransactions, gastosFixosMetas,
    highlightedIds, importTransactionsBatch, importedKeys, investimentos,
    legacyImportedTransactions, metas, salvarMetas,
    hiddenCatLabels, hiddenGfKeys, setHiddenCatLabels, setHiddenGfKeys,
    visibleCatIcons, visibleCats, visibleGastosFix,
  ]);

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
