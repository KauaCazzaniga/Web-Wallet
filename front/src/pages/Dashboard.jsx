import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import ImportModal from '../components/ImportModal';
import {
  Home, ArrowUpCircle, ArrowDownCircle, Wallet,
  Plus, AlertTriangle, X, Trash2, Settings, FileText, CheckCircle, LogOut, Moon, SunMedium,
} from "lucide-react";
import { GASTOS_FIXOS, GASTOS_FIXOS_PREFIX } from '../constants/gastosFixos';
import { CATEGORIAS_IMPORTACAO, gerarChaveTransacao, prepararTransacoesImportadas } from '../utils/categorizador';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { parseBankStatement } from '../utils/geminiParser';

// sub-componentes do Dashboard
import DashboardHeader from '../components/dashboard/DashboardHeader';
import InvestmentPanel from '../components/dashboard/InvestmentPanel';
import GoalCards from '../components/dashboard/GoalCards';
import TransactionList from '../components/dashboard/TransactionList';

// estilos e utilitários compartilhados
import { ModalOverlay, ModalContent, ModalHeader, FormGroup, ModalFooter } from '../components/dashboard/dashboardStyles';
import {
  ITEMS_POR_PAGINA, EMPTY_RESUMO_MES, EMPTY_IMPORT_STATE,
  CAT_ICONS, CATS, fmt, fmtCurrency, competenciaHoje, formatarCompetencia,
  getTransactionRawDate, getTransactionCompetencia, sortTransactionsByDateDesc,
} from '../components/dashboard/dashboardUtils';

// ── Animações ────────────────────────────────────────────────────────────────
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Toasts ───────────────────────────────────────────────────────────────────
const ToastContainer = styled.div`
  position: fixed; bottom: 2rem; right: 2rem; z-index: 200;
  display: flex; flex-direction: column; gap: 0.5rem;
`;
const Toast = styled.div`
  background-color: ${p => p.$type === 'error' ? '#ef4444' : '#10b981'};
  color: white; padding: 0.875rem 1.25rem; border-radius: 0.5rem;
  display: flex; align-items: center; gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: ${slideIn} 0.25s ease-out; font-weight: 500; font-size: 0.875rem; min-width: 240px;
`;

// ── Layout ───────────────────────────────────────────────────────────────────
const AppContainer = styled.div`
  min-height: 100vh; display: flex;
  font-family: "Inter", sans-serif; color: var(--dash-heading);
  background: ${p => p.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 24%), linear-gradient(180deg, #04101f 0%, #071425 45%, #030b15 100%)'
    : 'linear-gradient(180deg, #eff4ff 0%, #f8fbff 100%)'};
  --dash-shell:         ${p => p.$dark ? 'rgba(7,18,35,0.92)'    : '#ffffff'};
  --dash-surface:       ${p => p.$dark ? 'rgba(9,20,38,0.88)'    : '#ffffff'};
  --dash-surface-muted: ${p => p.$dark ? 'rgba(13,29,54,0.86)'   : '#f6f9ff'};
  --dash-border:        ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#d8e3f3'};
  --dash-border-strong: ${p => p.$dark ? 'rgba(96,165,250,0.3)'  : '#bfd0ea'};
  --dash-heading:       ${p => p.$dark ? '#eff6ff'   : '#0f172a'};
  --dash-text:          ${p => p.$dark ? '#c6d4f1'   : '#334155'};
  --dash-muted:         ${p => p.$dark ? '#89a0c7'   : '#7184a0'};
  --dash-muted-strong:  ${p => p.$dark ? '#bfd0ea'   : '#4f5f7a'};
  --dash-primary:       ${p => p.$dark ? '#60a5fa'   : '#2563eb'};
  --dash-primary-strong:${p => p.$dark ? '#3b82f6'   : '#1d4ed8'};
  --dash-primary-soft:  ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#dbeafe'};
  --dash-input-bg:      ${p => p.$dark ? 'rgba(6,18,34,0.92)'    : '#f8fbff'};
  --dash-table-head:    ${p => p.$dark ? 'rgba(12,25,46,0.88)'   : '#f4f8ff'};
  --dash-danger-soft:   ${p => p.$dark ? 'rgba(127,29,29,0.3)'   : '#fef2f2'};
  --dash-danger-border: ${p => p.$dark ? 'rgba(248,113,113,0.34)': '#fecaca'};
  --dash-shadow:        ${p => p.$dark ? '0 18px 40px rgba(2,12,27,0.38)'  : '0 16px 36px rgba(15,23,42,0.08)'};
  --dash-soft-shadow:   ${p => p.$dark ? '0 10px 28px rgba(2,12,27,0.3)'   : '0 10px 28px rgba(15,23,42,0.05)'};
`;
const Sidebar = styled.aside`
  width: 240px; background: var(--dash-shell); border-right: 1px solid var(--dash-border);
  display: flex; flex-direction: column; padding: 1.5rem 0; flex-shrink: 0;
  backdrop-filter: blur(18px);
  @media (max-width: 768px) {
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 400;
    transform: ${p => p.$open ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
    box-shadow: ${p => p.$open ? '4px 0 32px rgba(0,0,0,0.35)' : 'none'};
  }
`;
const MobileOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${p => p.$visible ? 'block' : 'none'};
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5); z-index: 399;
    backdrop-filter: blur(2px);
  }
`;
const LogoArea = styled.div`
  display: flex; align-items: center; gap: 0.5rem; padding: 0 1.5rem;
  font-size: 1.25rem; font-weight: 700; color: var(--dash-primary); margin-bottom: 2rem;
`;
const NavMenu = styled.nav`flex: 1; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;`;
const NavItem = styled.button`
  display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1rem;
  border: none; border-radius: 0.625rem; cursor: pointer; transition: all 0.15s;
  width: 100%; text-align: left; font-size: 0.875rem;
  background: ${p => p.$active ? 'var(--dash-primary-soft)' : 'transparent'};
  color:      ${p => p.$active ? 'var(--dash-primary)'      : 'var(--dash-muted)'};
  font-weight:${p => p.$active ? '600' : '400'};
  &:hover { background: ${p => p.$active ? 'var(--dash-primary-soft)' : 'var(--dash-surface-muted)'}; }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const SidebarFooter = styled.div`padding: 1rem 0.75rem 0; margin-top: auto; display: grid; gap: 0.75rem;`;
const LogoutButton = styled.button`
  display: flex; align-items: center; gap: 0.75rem; width: 100%;
  padding: 0.8rem 1rem; border: none; border-radius: 0.75rem;
  background: var(--dash-danger-soft); color: #ef4444; cursor: pointer;
  font-size: 0.9rem; font-weight: 600; text-align: left; transition: all 0.15s;
  box-shadow: inset 0 0 0 1px var(--dash-danger-border);
  &:hover { filter: brightness(1.05); }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const ThemeToggleBox = styled.button`
  display: flex; align-items: center; justify-content: space-between; gap: 0.9rem; width: 100%;
  padding: 0.82rem 1rem; border: none; border-radius: 0.95rem; cursor: pointer;
  background: ${p => p.$dark ? 'rgba(10,24,44,.85)' : '#ffffff'}; color: var(--dash-heading);
  box-shadow: ${p => p.$dark ? '0 14px 30px rgba(2,12,27,.28)' : '0 16px 28px rgba(15,23,42,.07)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.16)' : '#d8e3f3'}; margin-top: 0.65rem;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.05); }
`;
const ThemeToggleMeta = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  span   { display: block; font-size: 0.76rem; color: var(--dash-muted); margin-top: 0.08rem; }
  strong { display: block; font-size: 0.9rem; }
`;
const SwitchTrack = styled.div`
  width: 3rem; height: 1.65rem; border-radius: 999px; position: relative;
  background: ${p => p.$on ? 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' : (p.$dark ? 'rgba(30,41,59,.9)' : '#d8e3f3')};
  transition: background 0.2s ease;
`;
const SwitchThumb = styled.div`
  position: absolute; top: 0.17rem; left: ${p => p.$on ? '1.52rem' : '0.17rem'};
  width: 1.3rem; height: 1.3rem; border-radius: 999px; background: #fff;
  display: grid; place-items: center; color: ${p => p.$on ? '#2563eb' : '#64748b'};
  transition: left 0.2s ease; box-shadow: 0 4px 10px rgba(15,23,42,0.18);
`;
const MainContent  = styled.main`flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;`;
const ContentArea  = styled.div`
  flex: 1; padding: 1.75rem; overflow-y: auto;
  @media (max-width: 768px) { padding: 1rem; }
`;
const ContentWrapper = styled.div`max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;`;

// ── KPI Cards ────────────────────────────────────────────────────────────────
const KpiGrid = styled.div`
  display: grid; gap: 1.25rem; grid-template-columns: repeat(1, 1fr);
  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); }
`;
const KpiCard = styled.div`
  background: var(--dash-surface); padding: 1.25rem 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
`;
const HighlightCard = styled(KpiCard)`
  background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%);
  border-color: transparent; box-shadow: 0 18px 34px rgba(37,99,235,0.26);
`;
const KpiHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;
  h3 { font-size: 0.75rem; font-weight: 500; color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.04em; }
`;
const HiHeader = styled(KpiHeader)`h3 { color: #c7d2fe; }`;
const IconBox = styled.div`
  padding: 0.4rem; border-radius: 0.4rem; display: flex; align-items: center; justify-content: center;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  ${p => p.$t === 'in'  && css`background: #f0fdf4; color: #16a34a;`}
  ${p => p.$t === 'out' && css`background: #fef2f2; color: #dc2626;`}
  ${p => p.$t === 'bal' && css`background: rgba(255,255,255,0.2); color: #fff;`}
  &:hover { transform: translateY(-4px) scale(1.08); filter: brightness(1.08); box-shadow: 0 12px 24px rgba(37,99,235,0.18); }
`;
const KpiVal = styled.p`font-size: 1.75rem; font-weight: 700; color: var(--dash-heading); line-height: 1;`;
const HiVal  = styled(KpiVal)`color: #fff;`;

// ── Modais inline ─────────────────────────────────────────────────────────────
const DeleteModal = ({ onConfirm, onCancel }) => (
  <ModalOverlay>
    <ModalContent $sm>
      <ModalHeader>
        <h3>Excluir transação</h3>
        <button onClick={onCancel}><X size={18} /></button>
      </ModalHeader>
      <p style={{ fontSize: '0.875rem', color: 'var(--dash-text)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        Tem certeza? <strong style={{ color: 'var(--dash-heading)' }}>Esta ação não pode ser desfeita.</strong>
      </p>
      <ModalFooter>
        <button className="cancel" onClick={onCancel}>Cancelar</button>
        <button className="danger" onClick={onConfirm}>Excluir</button>
      </ModalFooter>
    </ModalContent>
  </ModalOverlay>
);

const ConfirmActionModal = ({ title, message, confirmLabel, onConfirm, onCancel }) => (
  <ModalOverlay>
    <ModalContent $sm>
      <ModalHeader>
        <h3>{title}</h3>
        <button onClick={onCancel}><X size={18} /></button>
      </ModalHeader>
      <p style={{ fontSize: '0.875rem', color: 'var(--dash-text)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        {message} <strong style={{ color: 'var(--dash-heading)' }}>Esta ação não pode ser desfeita.</strong>
      </p>
      <ModalFooter>
        <button className="cancel" onClick={onCancel}>Cancelar</button>
        <button className="danger" onClick={onConfirm}>{confirmLabel}</button>
      </ModalFooter>
    </ModalContent>
  </ModalOverlay>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardContent() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const {
    highlightedIds,
    legacyImportedTransactions,
    metas,
    gastosFixosMetas,
    importTransactionsBatch,
    clearLegacyImportedTransactions,
    visibleCats,
    visibleCatIcons,
    visibleGastosFix,
  } = useFinance();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados do servidor
  const [transactions, setTransactions] = useState([]);
  const [resumoMes, setResumoMes] = useState(EMPTY_RESUMO_MES);

  // Modais
  const [txModal, setTxModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, mode: 'single', id: null, count: 0 });
  const [importingExtract, setImportingExtract] = useState(false);
  const [importingSave, setImportingSave] = useState(false);
  const [migratingLegacyImports, setMigratingLegacyImports] = useState(false);
  const [importData, setImportData] = useState(EMPTY_IMPORT_STATE);

  // Formulários
  const [txForm, setTxForm] = useState({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
  const [investmentModal, setInvestmentModal] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({ mes: competenciaHoje(), valor: '', descricao: '' });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mês selecionado
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    try {
      const saved = localStorage.getItem('webwallet_mes_selecionado');
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch { /* ignora */ }
    return competenciaHoje();
  });
  const [loadingMes, setLoadingMes] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [addMesModal, setAddMesModal] = useState(false);
  const [addMesForm, setAddMesForm] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
  });

  // Gastos fixos — acordeão
  const [gastosFixosAberto, setGastosFixosAberto] = useState(() => {
    try {
      const saved = localStorage.getItem('webwallet_gastosfixos_aberto');
      if (saved !== null) return saved === 'true';
    } catch { /* ignora */ }
    return false;
  });

  // Total investido (acumulado até mês selecionado)
  const [totalInvestido, setTotalInvestido] = useState(0);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const notify = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  const mesAtual   = competenciaHoje();
  const ehMesAtual = mesSelecionado === mesAtual;

  const labelMes = useMemo(() => {
    const [y, m] = mesSelecionado.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [mesSelecionado]);

  const handleMesSelecionadoChange = useCallback((next) => {
    if (!/^\d{4}-\d{2}$/.test(next)) return;
    setMesSelecionado(next);
    try { localStorage.setItem('webwallet_mes_selecionado', next); } catch { /* ignora */ }
  }, []);

  const handleHeaderMesChange = useCallback((val) => {
    if (val === '__add__') setAddMesModal(true);
    else handleMesSelecionadoChange(val);
  }, [handleMesSelecionadoChange]);

  // ── Fetch meses disponíveis ───────────────────────────────────────────────
  const fetchMesesDisponiveis = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/meses');
      setMesesDisponiveis(data.meses || []);
    } catch { setMesesDisponiveis([]); }
  }, []);

  useEffect(() => { fetchMesesDisponiveis(); }, [fetchMesesDisponiveis]);

  const handleAddMes = () => {
    const comp = `${addMesForm.ano}-${String(addMesForm.mes).padStart(2, '0')}`;
    const hoje = new Date();
    const eFuturo = addMesForm.ano > hoje.getFullYear() ||
      (addMesForm.ano === hoje.getFullYear() && addMesForm.mes > hoje.getMonth() + 1);
    if (eFuturo) { notify('Não é possível adicionar um mês futuro.', 'error'); return; }
    if (mesesDisponiveis.includes(comp)) { notify('Este mês já está na lista.', 'error'); return; }
    const novosMeses = [...mesesDisponiveis, comp].sort((a, b) => b.localeCompare(a));
    setMesesDisponiveis(novosMeses);
    handleMesSelecionadoChange(comp);
    setAddMesModal(false);
  };

  // ── Fetch transações do mês ───────────────────────────────────────────────
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
      setLoading(false);
      if (!silent) setLoadingMes(false);
    }
  }, [mesSelecionado, notify]);

  useEffect(() => { fetchMesSelecionado(); }, [fetchMesSelecionado]);
  useEffect(() => { setPaginaAtual(1); }, [mesSelecionado]);

  // ── Total investido acumulado ─────────────────────────────────────────────
  useEffect(() => {
    const comp = mesSelecionado || competenciaHoje();
    api.get(`/wallet/total-investido?ate=${comp}`)
      .then(res => setTotalInvestido(Number(res.data?.total || 0)))
      .catch(() => {});
  }, [transactions, mesSelecionado]);

  // ── Migração de importações legadas ──────────────────────────────────────
  const fetchTransactionsByCompetencia = useCallback(async (competencias = []) => {
    const unicas = Array.from(new Set(competencias.filter(Boolean)));
    const respostas = await Promise.all(unicas.map(async (comp) => {
      try {
        const { data } = await api.get(`/wallet/extrato/${comp}`);
        return data?.transacoes || [];
      } catch (error) {
        if (error?.response?.status === 404) return [];
        throw error;
      }
    }));
    return respostas.flat();
  }, []);

  useEffect(() => {
    if (!legacyImportedTransactions.length || migratingLegacyImports) return;
    let cancelled = false;

    const migrar = async () => {
      setMigratingLegacyImports(true);
      try {
        const competenciasLegadas = Array.from(new Set(
          legacyImportedTransactions.map(tx => getTransactionCompetencia(tx)).filter(Boolean),
        ));
        const transacoesServidor = await fetchTransactionsByCompetencia(competenciasLegadas);
        const chavesExistentes = new Set(
          transacoesServidor.map(tx => gerarChaveTransacao({
            data: String(getTransactionRawDate(tx) || '').slice(0, 10),
            valor: tx.valor, descricao: tx.descricao,
          })),
        );
        const payload = legacyImportedTransactions.reduce((acc, tx) => {
          const comp = getTransactionCompetencia(tx);
          if (!comp) return acc;
          const chave = gerarChaveTransacao({
            data: String(getTransactionRawDate(tx) || '').slice(0, 10),
            valor: tx.valor, descricao: tx.descricao,
          });
          if (chavesExistentes.has(chave)) return acc;
          chavesExistentes.add(chave);
          acc.push({
            tipo: tx.tipo, categoria: tx.categoria, valor: Number(tx.valor),
            descricao: tx.descricao, tags: Array.isArray(tx.tags) ? tx.tags : [],
            competencia: comp, data_hora: String(getTransactionRawDate(tx) || '').slice(0, 10),
          });
          return acc;
        }, []);

        if (payload.length) {
          const { data } = await api.post('/wallet/transacoes/importar', { transacoes: payload });
          if (!cancelled) {
            await importTransactionsBatch(data?.transacoes || []);
            if (payload.some(tx => tx.competencia === mesSelecionado)) {
              await fetchMesSelecionado({ silent: true });
            }
            notify(`${payload.length} transações antigas foram migradas para o banco.`);
          }
        }
        if (!cancelled) clearLegacyImportedTransactions();
      } catch {
        if (!cancelled) notify('Não foi possível migrar importações antigas para o banco', 'error');
      } finally {
        if (!cancelled) setMigratingLegacyImports(false);
      }
    };

    migrar();
    return () => { cancelled = true; };
  }, [
    clearLegacyImportedTransactions, fetchMesSelecionado, fetchTransactionsByCompetencia,
    importTransactionsBatch, legacyImportedTransactions, mesSelecionado, migratingLegacyImports, notify,
  ]);

  // ── Import de extrato PDF ─────────────────────────────────────────────────
  const closeImportModal = () => { setImportModal(false); setImportData(EMPTY_IMPORT_STATE); };

  const handleImportFile = async (file) => {
    setImportingExtract(true);
    try {
      const textoExtraido = await extractTextFromPdf(file);
      const parsed = await parseBankStatement(textoExtraido);
      const transacoesPreparadas = prepararTransacoesImportadas(parsed.transacoes);

      if (!transacoesPreparadas.length) throw new Error('Nenhuma transação identificada neste extrato');

      const competenciasExtrato = Array.from(new Set(
        transacoesPreparadas.map(tx => tx.data?.slice(0, 7)).filter(Boolean),
      ));
      const transacoesServidor = await fetchTransactionsByCompetencia(competenciasExtrato);
      const chavesExistentes = new Set(
        transacoesServidor.map(tx => gerarChaveTransacao({
          data: String(getTransactionRawDate(tx) || '').slice(0, 10),
          valor: tx.valor, descricao: tx.descricao,
        })),
      );
      const chavesNoArquivo = new Set();
      const transacoesComDeduplicacao = transacoesPreparadas.map(tx => {
        const chave = gerarChaveTransacao(tx);
        const duplicada = chavesExistentes.has(chave) || chavesNoArquivo.has(chave);
        chavesNoArquivo.add(chave);
        return { ...tx, duplicada, avisoDuplicata: duplicada ? 'Possível duplicata' : null };
      });

      setImportData({ ...parsed, total_transacoes: transacoesComDeduplicacao.length, transacoes: transacoesComDeduplicacao });
      setImportModal(true);
    } catch (err) {
      notify(err?.message || 'Erro ao importar extrato', 'error');
    } finally {
      setImportingExtract(false);
    }
  };

  const handleImportCategoryChange = (idLocal, categoria) => {
    setImportData(cur => ({ ...cur, transacoes: cur.transacoes.map(tx => tx.idLocal === idLocal ? { ...tx, categoria } : tx) }));
  };
  const handleImportTypeChange = (idLocal, tipo) => {
    setImportData(cur => ({ ...cur, transacoes: cur.transacoes.map(tx => tx.idLocal === idLocal ? { ...tx, tipo } : tx) }));
  };
  const handleToggleImportedSelection = (idLocal) => {
    setImportData(cur => ({ ...cur, transacoes: cur.transacoes.map(tx => tx.idLocal === idLocal ? { ...tx, incluir: !tx.incluir } : tx) }));
  };
  const handleConfirmImport = async () => {
    const selecionadas = importData.transacoes.filter(tx => tx.incluir);
    if (!selecionadas.length) { notify('Selecione ao menos uma transação para importar', 'error'); return; }
    setImportingSave(true);
    try {
      const payload = selecionadas.map(tx => ({
        tipo: tx.tipo, categoria: tx.categoria, valor: Number(tx.valor), descricao: tx.descricao,
        tags: Array.isArray(tx.tags) ? tx.tags : [],
        competencia: tx.data?.slice(0, 7) || mesSelecionado || competenciaHoje(), data_hora: tx.data,
      }));
      const { data } = await api.post('/wallet/transacoes/importar', { transacoes: payload });
      const adicionadas = await importTransactionsBatch(data?.transacoes || []);
      closeImportModal();
      await fetchMesSelecionado({ silent: true });
      fetchMesesDisponiveis();
      notify(`${adicionadas.length} transações importadas com sucesso`);
    } catch (err) {
      notify(err?.message || 'Não foi possível salvar as transações importadas', 'error');
    } finally {
      setImportingSave(false);
    }
  };

  // ── Salvar transação ──────────────────────────────────────────────────────
  const handleSaveTransaction = async () => {
    const desc = txForm.descricao.trim();
    if (!desc) return notify('Informe uma descrição', 'error');
    if (!txForm.valor) return notify('Informe o valor', 'error');
    if (Number(txForm.valor) <= 0) return notify('O valor deve ser maior que zero', 'error');
    setSaving(true);
    try {
      await api.post('/wallet/transacao', { ...txForm, descricao: desc, valor: Number(txForm.valor), competencia: mesSelecionado || competenciaHoje() });
      setTxModal(false);
      setTxForm({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
      await fetchMesSelecionado({ silent: true });
      fetchMesesDisponiveis();
      notify('Transação registrada!');
    } catch {
      notify('Erro ao salvar transação', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir transação ─────────────────────────────────────────────────────
  const requestDelete = (tx) => {
    setDelConfirm({ open: true, mode: 'single', id: tx?._id, count: 1 });
  };
  const requestDeleteAll = () => {
    if (!transacoesMes.length) { notify('Não há transações para excluir neste mês', 'error'); return; }
    setDelConfirm({ open: true, mode: 'all', id: null, count: transacoesMes.length });
  };
  const confirmDelete = async () => {
    const id = delConfirm.id;
    const txToDelete = transactions.find(tx => tx._id === id);
    setTransactions(prev => prev.filter(tx => tx._id !== id));
    setDelConfirm({ open: false, mode: 'single', id: null, count: 0 });
    notify('Transação removida!');
    try {
      await api.delete(`/wallet/transacao/${id}`, {
        data: { competencia: getTransactionCompetencia(txToDelete) || mesSelecionado || competenciaHoje() },
      });
      await fetchMesSelecionado({ silent: true });
    } catch {
      notify('Erro ao excluir — recarregue a página', 'error');
      await fetchMesSelecionado({ silent: true });
    }
  };
  const confirmDeleteAll = async () => {
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
  };

  // ── Investimentos ─────────────────────────────────────────────────────────
  const resetInvestmentForm = () => setInvestmentForm({ mes: competenciaHoje(), valor: '', descricao: '' });
  const openInvestmentModal = () => { resetInvestmentForm(); setInvestmentModal(true); };
  const handleSaveInvestment = async () => {
    if (!investmentForm.valor || Number(investmentForm.valor) <= 0) {
      notify('Informe um valor válido para o aporte', 'error'); return;
    }
    setSavingInvestment(true);
    try {
      await api.post('/wallet/transacao', {
        competencia: investmentForm.mes || competenciaHoje(),
        tipo: 'despesa', categoria: 'Investimentos',
        valor: Number(investmentForm.valor), descricao: investmentForm.descricao || 'Aporte',
      });
      setInvestmentModal(false);
      resetInvestmentForm();
      await fetchMesSelecionado({ silent: true });
      fetchMesesDisponiveis();
      notify('Aporte registrado com sucesso!');
    } catch {
      notify('Não foi possível registrar o aporte', 'error');
    } finally {
      setSavingInvestment(false);
    }
  };

  const toggleGastosFixos = useCallback(() => {
    setGastosFixosAberto(prev => {
      const next = !prev;
      try { localStorage.setItem('webwallet_gastosfixos_aberto', String(next)); } catch { /* ignora */ }
      return next;
    });
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  // ── Dados derivados ───────────────────────────────────────────────────────
  const transacoesMes = useMemo(
    () => [...transactions].sort(sortTransactionsByDateDesc),
    [transactions],
  );

  const mesesEfetivos = useMemo(() => {
    const set = new Set(mesesDisponiveis);
    if (!set.has(mesSelecionado)) return [mesSelecionado, ...mesesDisponiveis].sort((a, b) => b.localeCompare(a));
    return mesesDisponiveis;
  }, [mesesDisponiveis, mesSelecionado]);

  const totalPaginas = Math.max(1, Math.ceil(transacoesMes.length / ITEMS_POR_PAGINA));

  const transacoesPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
    return transacoesMes.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [transacoesMes, paginaAtual]);

  const kpiReceitas = useMemo(
    () => transacoesMes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor || 0), 0),
    [transacoesMes],
  );
  const kpiDespesas = useMemo(
    () => transacoesMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor || 0), 0),
    [transacoesMes],
  );
  const kpiSaldo = Number(resumoMes.saldo_inicial || 0) + kpiReceitas - kpiDespesas;

  const gastosAtuais = useMemo(() => {
    const result = {};
    transacoesMes.forEach(t => {
      if (t.tipo === 'despesa') result[t.categoria] = (result[t.categoria] || 0) + Number(t.valor || 0);
    });
    return result;
  }, [transacoesMes]);

  const limites = useMemo(() => {
    const result = { ...metas };
    Object.entries(gastosFixosMetas).forEach(([k, v]) => { result[GASTOS_FIXOS_PREFIX + k] = v; });
    return result;
  }, [metas, gastosFixosMetas]);

  const todasCategorias = Array.from(new Set([
    ...Object.keys(gastosAtuais), ...Object.keys(limites),
  ])).filter(c => c !== 'Salário' && c !== 'Receita' && !String(c).startsWith(GASTOS_FIXOS_PREFIX));

  const gfGastos = useMemo(() => {
    const result = {};
    GASTOS_FIXOS.forEach(({ key }) => { result[key] = Number(gastosAtuais[GASTOS_FIXOS_PREFIX + key] || 0); });
    return result;
  }, [gastosAtuais]);

  const gfMetas = useMemo(() => {
    const result = {};
    GASTOS_FIXOS.forEach(({ key }) => { result[key] = Number(limites[GASTOS_FIXOS_PREFIX + key] || 0); });
    return result;
  }, [limites]);

  const gfTotalGasto = useMemo(() => Object.values(gfGastos).reduce((a, b) => a + b, 0), [gfGastos]);
  const gfTotalMeta  = useMemo(() => GASTOS_FIXOS.reduce((acc, { key }) => {
    const m = gfMetas[key]; return m > 0 ? acc + m : acc;
  }, 0), [gfMetas]);
  const gfTotalPct   = gfTotalMeta > 0 ? (gfTotalGasto / gfTotalMeta) * 100 : -1;

  const totalOrcamento = Object.values(limites).reduce((a, b) => a + Number(b), 0);
  const acima = totalOrcamento > 0 && kpiDespesas > totalOrcamento;

  const aporteMesSelecionado = useMemo(
    () => transacoesMes.filter(t => t.categoria === 'Investimentos').reduce((acc, t) => acc + Number(t.valor || 0), 0),
    [transacoesMes],
  );

  // ── Auto-abertura acordeão se alerta ─────────────────────────────────────
  useEffect(() => {
    const alerta = GASTOS_FIXOS.some(({ key }) => {
      const meta = gfMetas[key];
      if (meta <= 0) return false;
      return (gfGastos[key] / meta) * 100 >= 85;
    });
    if (alerta) {
      setGastosFixosAberto(true);
      try { localStorage.setItem('webwallet_gastosfixos_aberto', 'true'); } catch { /* ignora */ }
    }
  }, [gfGastos, gfMetas]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <AppContainer $dark={isDark} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Wallet size={40} color={isDark ? '#60a5fa' : '#2563eb'} style={{ marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--dash-muted)', fontSize: '0.875rem' }}>Carregando seu dashboard...</p>
      </div>
    </AppContainer>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppContainer $dark={isDark}>

      <MobileOverlay $visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      {/* Toast */}
      {toast.show && (
        <ToastContainer>
          <Toast $type={toast.type}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </Toast>
        </ToastContainer>
      )}

      {/* Modal: adicionar mês */}
      {addMesModal && (
        <ModalOverlay onClick={e => e.target === e.currentTarget && setAddMesModal(false)}>
          <ModalContent $sm>
            <ModalHeader>
              <h3>Adicionar mês</h3>
              <button onClick={() => setAddMesModal(false)}><X size={18} /></button>
            </ModalHeader>
            <FormGroup>
              <label>Mês</label>
              <select value={addMesForm.mes} onChange={e => setAddMesForm(f => ({ ...f, mes: Number(e.target.value) }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, m - 1, 1));
                  return <option key={m} value={m}>{nome.charAt(0).toUpperCase() + nome.slice(1)}</option>;
                })}
              </select>
            </FormGroup>
            <FormGroup>
              <label>Ano</label>
              <input type="number" value={addMesForm.ano} min={2000} max={new Date().getFullYear()}
                onChange={e => setAddMesForm(f => ({ ...f, ano: Number(e.target.value) }))} />
            </FormGroup>
            <ModalFooter>
              <button className="cancel" onClick={() => setAddMesModal(false)}>Cancelar</button>
              <button className="save" onClick={handleAddMes}>Confirmar</button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal: confirmar exclusão simples */}
      {delConfirm.open && delConfirm.mode === 'single' && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDelConfirm({ open: false, mode: 'single', id: null, count: 0 })}
        />
      )}

      {/* Modal: confirmar exclusão em massa */}
      {delConfirm.open && delConfirm.mode === 'all' && (
        <ConfirmActionModal
          title="Excluir todas as transações"
          message={`Tem certeza que deseja excluir todas as ${delConfirm.count} transações deste mês?`}
          confirmLabel="Excluir tudo"
          onConfirm={confirmDeleteAll}
          onCancel={() => setDelConfirm({ open: false, mode: 'single', id: null, count: 0 })}
        />
      )}

      {/* Modal: nova transação */}
      {txModal && (
        <ModalOverlay onClick={e => e.target === e.currentTarget && setTxModal(false)}>
          <ModalContent>
            <ModalHeader>
              <h3>Nova Transação</h3>
              <button onClick={() => setTxModal(false)}><X size={18} /></button>
            </ModalHeader>
            <FormGroup>
              <label>Tipo</label>
              <select value={txForm.tipo} onChange={e => setTxForm({ ...txForm, tipo: e.target.value })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </FormGroup>
            <FormGroup>
              <label>Descrição</label>
              <input autoFocus type="text" placeholder="Ex: Conta de Luz"
                value={txForm.descricao} onChange={e => setTxForm({ ...txForm, descricao: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <label>Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" placeholder="0,00"
                value={txForm.valor} onChange={e => setTxForm({ ...txForm, valor: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <label>Categoria</label>
              <select value={txForm.categoria} onChange={e => setTxForm({ ...txForm, categoria: e.target.value })}>
                {visibleCats.map(c => <option key={c} value={c}>{visibleCatIcons[c]} {c}</option>)}
                {visibleGastosFix.length > 0 && (
                  <optgroup label="── Gastos Fixos ──">
                    {visibleGastosFix.map(({ key, label, icon }) => (
                      <option key={key} value={GASTOS_FIXOS_PREFIX + key}>{icon} {label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </FormGroup>
            <ModalFooter>
              <button className="cancel" onClick={() => setTxModal(false)} disabled={saving}>Cancelar</button>
              <button className="save" onClick={handleSaveTransaction} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal: registrar aporte */}
      {investmentModal && (
        <ModalOverlay onClick={e => { if (e.target === e.currentTarget) { setInvestmentModal(false); resetInvestmentForm(); } }}>
          <ModalContent $sm>
            <ModalHeader>
              <h3>Registrar aporte</h3>
              <button onClick={() => { setInvestmentModal(false); resetInvestmentForm(); }}><X size={18} /></button>
            </ModalHeader>
            <FormGroup>
              <label>Mês/Ano</label>
              <input type="month" value={investmentForm.mes}
                onChange={e => setInvestmentForm({ ...investmentForm, mes: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <label>Valor</label>
              <input type="number" min="0.01" step="0.01" placeholder="0,00"
                value={investmentForm.valor}
                onChange={e => setInvestmentForm({ ...investmentForm, valor: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <label>Descrição</label>
              <input type="text" placeholder="Ex: CDB, Ações"
                value={investmentForm.descricao}
                onChange={e => setInvestmentForm({ ...investmentForm, descricao: e.target.value })} />
            </FormGroup>
            <ModalFooter>
              <button className="cancel" onClick={() => { setInvestmentModal(false); resetInvestmentForm(); }} disabled={savingInvestment}>Cancelar</button>
              <button className="save" onClick={handleSaveInvestment} disabled={savingInvestment}>
                {savingInvestment ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Import Modal */}
      <ImportModal
        open={importModal} parsedData={importData} categories={CATEGORIAS_IMPORTACAO}
        saving={importingSave} onClose={closeImportModal} onConfirm={handleConfirmImport}
        onChangeCategory={handleImportCategoryChange} onChangeType={handleImportTypeChange}
        onToggleInclude={handleToggleImportedSelection}
      />

      {/* Sidebar */}
      <Sidebar $open={sidebarOpen}>
        <LogoArea><Wallet size={22} /> Waltrix</LogoArea>
        <NavMenu>
          <NavItem $active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); navigate('/dashboard'); setSidebarOpen(false); }}>
            <Home size={17} /> Dashboard
          </NavItem>
          <NavItem onClick={() => { navigate('/relatorios'); setSidebarOpen(false); }}>
            <FileText size={17} /> Relatórios
          </NavItem>
          <NavItem onClick={() => { navigate('/configuracoes'); setSidebarOpen(false); }}>
            <Settings size={17} /> Configurações
          </NavItem>
        </NavMenu>
        <SidebarFooter>
          <ThemeToggleBox onClick={toggleTheme} title="Alternar tema" $dark={isDark}>
            <ThemeToggleMeta>
              {isDark ? <Moon size={18} color="#60a5fa" /> : <SunMedium size={18} color="#2563eb" />}
              <div>
                <strong>Mode</strong>
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
            </ThemeToggleMeta>
            <SwitchTrack $on={isDark} $dark={isDark}>
              <SwitchThumb $on={isDark}>
                {isDark ? <Moon size={12} /> : <SunMedium size={12} />}
              </SwitchThumb>
            </SwitchTrack>
          </ThemeToggleBox>
          <LogoutButton onClick={handleLogout} title="Sair">
            <LogOut size={18} /> Sair
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      {/* Main */}
      <MainContent>
        <DashboardHeader
          mesSelecionado={mesSelecionado}
          mesesEfetivos={mesesEfetivos}
          ehMesAtual={ehMesAtual}
          isDark={isDark}
          onMesChange={handleHeaderMesChange}
          importingExtract={importingExtract}
          onImportFile={handleImportFile}
          onError={(msg) => notify(msg, 'error')}
          onAddTransaction={() => setTxModal(true)}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />

        <ContentArea>
          <ContentWrapper>

            {/* KPI cards */}
            <KpiGrid>
              <KpiCard>
                <KpiHeader>
                  <h3>Receitas</h3>
                  <IconBox $t="in"><ArrowUpCircle size={18} /></IconBox>
                </KpiHeader>
                <KpiVal>R$ {fmt(kpiReceitas)}</KpiVal>
              </KpiCard>
              <KpiCard>
                <KpiHeader>
                  <h3>Despesas</h3>
                  <IconBox $t="out"><ArrowDownCircle size={18} /></IconBox>
                </KpiHeader>
                <KpiVal>R$ {fmt(kpiDespesas)}</KpiVal>
              </KpiCard>
              <HighlightCard>
                <HiHeader>
                  <h3>Saldo do Mês</h3>
                  <IconBox $t="bal"><Wallet size={18} /></IconBox>
                </HiHeader>
                <HiVal>R$ {fmt(kpiSaldo)}</HiVal>
              </HighlightCard>
            </KpiGrid>

            {/* Investimentos */}
            <InvestmentPanel
              totalInvestido={totalInvestido}
              aporteMesSelecionado={aporteMesSelecionado}
              ehMesAtual={ehMesAtual}
              onRegisterAporte={openInvestmentModal}
            />

            {/* TODO: gráfico cumulativo e tabela de aportes → src/pages/Relatorios.jsx */}

            {/* Orçamento + categorias */}
            <GoalCards
              totalDespesas={kpiDespesas}
              totalOrcamento={totalOrcamento}
              acima={acima}
              todasCategorias={todasCategorias}
              gastosAtuais={gastosAtuais}
              limites={limites}
              mesSelecionado={mesSelecionado}
              notify={notify}
              gastosFixosAberto={gastosFixosAberto}
              toggleGastosFixos={toggleGastosFixos}
              gfGastos={gfGastos}
              gfMetas={gfMetas}
              gfTotalGasto={gfTotalGasto}
              gfTotalMeta={gfTotalMeta}
              gfTotalPct={gfTotalPct}
            />

            {/* Tabela de transações */}
            <TransactionList
              transacoesMes={transacoesMes}
              transacoesPaginadas={transacoesPaginadas}
              paginaAtual={paginaAtual}
              setPaginaAtual={setPaginaAtual}
              totalPaginas={totalPaginas}
              loadingMes={loadingMes}
              labelMes={labelMes}
              highlightedIds={highlightedIds}
              onDelete={requestDelete}
              onDeleteAll={requestDeleteAll}
              onAddFirst={() => setTxModal(true)}
            />

          </ContentWrapper>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
