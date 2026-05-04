// Componente: Investimentos
// Responsabilidade: Página dedicada a investimentos — carteira por tipo, cofrinhos de metas e evolução patrimonial
// Depende de: AuthContext, ThemeContext, lucide-react, recharts, styled-components

import React, { useState, useContext, useEffect, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Home, TrendingUp, FileText, Settings, LogOut,
  Moon, SunMedium, Plus, X, Edit2, Trash2,
  PiggyBank, Target, Wallet,
  CheckCircle, Menu,
  ArrowUpCircle, ArrowDownCircle, Landmark, Coins,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ComposedChart, Line, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  listarInvestimentos, criarInvestimento, atualizarInvestimento, removerInvestimento,
  listarCofrinhos, criarCofrinho, atualizarCofrinho, depositarCofrinho, removerCofrinho,
} from '../services/investments';

// ─────────────────────────────────────────────────────────────
// CONSTANTES DE UI
// ─────────────────────────────────────────────────────────────

const TIPOS_INVESTIMENTO = [
  { key: 'CDB',      label: 'CDB',            icone: '🏦', cor: '#3b82f6' },
  { key: 'LCI',      label: 'LCI',            icone: '🏡', cor: '#10b981' },
  { key: 'LCA',      label: 'LCA',            icone: '🌱', cor: '#06b6d4' },
  { key: 'Tesouro',  label: 'Tesouro Direto', icone: '🏛️', cor: '#f59e0b' },
  { key: 'Poupança', label: 'Poupança',        icone: '💰', cor: '#84cc16' },
  { key: 'Ações',    label: 'Ações',           icone: '📊', cor: '#8b5cf6' },
  { key: 'FII',      label: 'FII',            icone: '🏢', cor: '#ec4899' },
  { key: 'Cripto',   label: 'Cripto',          icone: '🪙', cor: '#f97316' },
  { key: 'Outro',    label: 'Outro',           icone: '📦', cor: '#94a3b8' },
];

const ICONES_COFRINHO = ['✈️','💻','🛡️','🚗','🏖️','🎓','💍','🏠','🎮','🐾','🎸','🍰'];
const CORES_COFRINHO  = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#f97316','#06b6d4','#84cc16','#e11d48','#14b8a6'];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Math.round((v || 0) * 100) / 100);

const fmtPct = (v) => `${Math.round(v * 10) / 10}%`;

/** Cor da barra de progresso de cofrinho — progresso em 0-100 */
function corProgresso(pct) {
  if (pct >= 100) return '#10b981';
  if (pct >= 86)  return '#D85A30';
  if (pct >= 61)  return '#EF9F27';
  return '#378ADD';
}

function tipoInfo(key) {
  return TIPOS_INVESTIMENTO.find(t => t.key === key) || TIPOS_INVESTIMENTO[8];
}

function prazoLabel(prazo) {
  if (!prazo) return null;
  const [ano, mes] = prazo.split('-');
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(Number(ano), Number(mes) - 1));
}

function mesesRestantes(prazo) {
  if (!prazo) return null;
  const [ano, mes] = prazo.split('-');
  const alvo = new Date(Number(ano), Number(mes) - 1);
  const hoje = new Date();
  const diff = (alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth());
  return Math.max(0, diff);
}

/**
 * Deriva dados do gráfico de evolução patrimonial a partir da lista de investimentos.
 * Agrupa investimentos por mesInicio, calcula aporte mensal e patrimônio acumulado.
 * Retorna os últimos 6 meses com dados.
 * @param {Array} investimentos
 * @returns {Array<{ mes, aporte, patrimonio }>}
 */
function derivarEvolucao(investimentos) {
  if (!investimentos.length) return [];

  // Mapa mesInicio → aporte somado naquele mês
  const porMes = {};
  for (const inv of investimentos) {
    const key = inv.mesInicio || '';
    if (!key) continue;
    porMes[key] = (porMes[key] || 0) + inv.valor;
  }

  // Patrimônio total = soma de todos os valor + rendimento
  const patrimonioTotal = investimentos.reduce((s, i) => s + i.valor + (i.rendimento || 0), 0);

  // Ordena meses cronologicamente
  const mesesOrdenados = Object.keys(porMes).sort();

  // Distribui o patrimônio acumulado proporcionalmente ao longo dos meses
  let acumulado = 0;
  const totalAportado = Object.values(porMes).reduce((s, v) => s + v, 0);
  const fatorRendimento = totalAportado > 0 ? patrimonioTotal / totalAportado : 1;

  const resultado = mesesOrdenados.map((mesKey) => {
    const [ano, mes] = mesKey.split('-');
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(new Date(Number(ano), Number(mes) - 1));
    acumulado += porMes[mesKey];
    return {
      mes:       label.replace('.', ''),
      aporte:    Math.round(porMes[mesKey] * 100) / 100,
      patrimonio: Math.round(acumulado * fatorRendimento * 100) / 100,
    };
  });

  // Retorna no máximo os últimos 6 pontos
  return resultado.slice(-6);
}

// ─────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;
const popIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  display: inline-block;
  animation: ${spin} 1s linear infinite;
`;

// ─────────────────────────────────────────────────────────────
// APP CONTAINER + CSS VARIABLES
// ─────────────────────────────────────────────────────────────

const AppContainer = styled.div`
  min-height: 100vh; display: flex;
  font-family: "Inter", sans-serif; color: var(--dash-heading);
  background: ${p => p.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 24%), linear-gradient(180deg, #04101f 0%, #071425 45%, #030b15 100%)'
    : 'linear-gradient(180deg, #eff4ff 0%, #f8fbff 100%)'};

  --dash-shell:          ${p => p.$dark ? 'rgba(7,18,35,0.92)'    : '#ffffff'};
  --dash-surface:        ${p => p.$dark ? 'rgba(9,20,38,0.88)'    : '#ffffff'};
  --dash-surface-muted:  ${p => p.$dark ? 'rgba(13,29,54,0.86)'   : '#f6f9ff'};
  --dash-border:         ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#d8e3f3'};
  --dash-border-strong:  ${p => p.$dark ? 'rgba(96,165,250,0.3)'  : '#bfd0ea'};
  --dash-heading:        ${p => p.$dark ? '#eff6ff'   : '#0f172a'};
  --dash-text:           ${p => p.$dark ? '#c6d4f1'   : '#334155'};
  --dash-muted:          ${p => p.$dark ? '#89a0c7'   : '#7184a0'};
  --dash-muted-strong:   ${p => p.$dark ? '#bfd0ea'   : '#4f5f7a'};
  --dash-primary:        ${p => p.$dark ? '#60a5fa'   : '#2563eb'};
  --dash-primary-strong: ${p => p.$dark ? '#3b82f6'   : '#1d4ed8'};
  --dash-primary-soft:   ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#dbeafe'};
  --dash-input-bg:       ${p => p.$dark ? 'rgba(6,18,34,0.92)'    : '#f8fbff'};
  --dash-table-head:     ${p => p.$dark ? 'rgba(12,25,46,0.88)'   : '#f4f8ff'};
  --dash-danger-soft:    ${p => p.$dark ? 'rgba(127,29,29,0.3)'   : '#fef2f2'};
  --dash-danger-border:  ${p => p.$dark ? 'rgba(248,113,113,0.34)': '#fecaca'};
  --dash-shadow:         ${p => p.$dark ? '0 18px 40px rgba(2,12,27,0.38)'  : '0 16px 36px rgba(15,23,42,0.08)'};
  --dash-soft-shadow:    ${p => p.$dark ? '0 10px 28px rgba(2,12,27,0.3)'   : '0 10px 28px rgba(15,23,42,0.05)'};
`;

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────

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
    background: rgba(0,0,0,0.5); z-index: 399; backdrop-filter: blur(2px);
  }
`;
const LogoArea = styled.div`
  display: flex; align-items: center; gap: 0.5rem; padding: 0 1.5rem;
  font-size: 1.25rem; font-weight: 700; color: var(--dash-primary); margin-bottom: 2rem;
`;
const NavMenu = styled.nav`
  flex: 1; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;
`;
const NavItem = styled.button`
  display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1rem;
  border: none; border-radius: 0.625rem; cursor: pointer; transition: all 0.15s;
  width: 100%; text-align: left; font-size: 0.875rem;
  background: ${p => p.$active ? 'var(--dash-primary-soft)' : 'transparent'};
  color:      ${p => p.$active ? 'var(--dash-primary)'      : 'var(--dash-muted)'};
  font-weight:${p => p.$active ? '600' : '400'};
  &:hover { background: ${p => p.$active ? 'var(--dash-primary-soft)' : 'var(--dash-surface-muted)'}; }
  svg { transition: transform 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); }
`;
const SidebarFooter = styled.div`
  padding: 1rem 0.75rem 0; margin-top: auto; display: grid; gap: 0.75rem;
`;
const LogoutButton = styled.button`
  display: flex; align-items: center; gap: 0.75rem; width: 100%;
  padding: 0.8rem 1rem; border: none; border-radius: 0.75rem;
  background: var(--dash-danger-soft); color: #ef4444; cursor: pointer;
  font-size: 0.9rem; font-weight: 600; text-align: left; transition: all 0.15s;
  box-shadow: inset 0 0 0 1px var(--dash-danger-border);
  &:hover { filter: brightness(1.05); }
`;
const ThemeToggleBox = styled.button`
  display: flex; align-items: center; justify-content: space-between; gap: 0.9rem; width: 100%;
  padding: 0.82rem 1rem; border: none; border-radius: 0.95rem; cursor: pointer;
  background: ${p => p.$dark ? 'rgba(10,24,44,.85)' : '#ffffff'}; color: var(--dash-heading);
  box-shadow: ${p => p.$dark ? '0 14px 30px rgba(2,12,27,.28)' : '0 16px 28px rgba(15,23,42,.07)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.16)' : '#d8e3f3'}; margin-top: 0.65rem;
  transition: transform .22s ease, box-shadow .22s ease;
  &:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.05); }
`;
const ThemeToggleMeta = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  span   { display: block; font-size: 0.76rem; color: var(--dash-muted); margin-top: 0.08rem; }
  strong { display: block; font-size: 0.9rem; }
`;
const SwitchTrack = styled.div`
  width: 3rem; height: 1.65rem; border-radius: 999px; position: relative;
  background: ${p => p.$on ? 'linear-gradient(135deg,#06b6d4,#2563eb)' : (p.$dark ? 'rgba(30,41,59,.9)' : '#d8e3f3')};
  transition: background 0.2s;
`;
const SwitchThumb = styled.div`
  position: absolute; top: 0.17rem; left: ${p => p.$on ? '1.52rem' : '0.17rem'};
  width: 1.3rem; height: 1.3rem; border-radius: 999px; background: #fff;
  display: grid; place-items: center; color: ${p => p.$on ? '#2563eb' : '#64748b'};
  transition: left 0.2s; box-shadow: 0 4px 10px rgba(15,23,42,0.18);
`;

// ─────────────────────────────────────────────────────────────
// LAYOUT PRINCIPAL
// ─────────────────────────────────────────────────────────────

const MainContent  = styled.main`flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;`;
const TopBar = styled.header`
  padding: 1rem 1.75rem; border-bottom: 1px solid var(--dash-border);
  background: var(--dash-shell); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: space-between;
  @media (max-width: 768px) { padding: 1rem; }
`;
const TopBarLeft = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const MobileMenuBtn = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
    color: var(--dash-muted); padding: 0.25rem;
  }
`;
const PageTitle = styled.div`
  h1 { font-size: 1.125rem; font-weight: 700; color: var(--dash-heading); }
  p  { font-size: 0.8rem; color: var(--dash-muted); margin-top: 0.1rem; }
`;
const ContentArea = styled.div`
  flex: 1; padding: 1.75rem; overflow-y: auto;
  @media (max-width: 768px) { padding: 1rem; }
`;
const ContentWrapper = styled.div`
  max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;
`;

// ─────────────────────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────────────────────

const KpiGrid = styled.div`
  display: grid; gap: 1.25rem;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); }
`;
const KpiCard = styled.div`
  background: var(--dash-surface); padding: 1.25rem 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
  animation: ${fadeIn} 0.35s ease both;
`;
const KpiHighlight = styled(KpiCard)`
  background: linear-gradient(135deg, #7F77DD 0%, #5b67ff 52%, #4f46e5 100%);
  border-color: transparent; box-shadow: 0 18px 34px rgba(127,119,221,0.3);
`;
const KpiLabel = styled.div`
  font-size: 0.72rem; font-weight: 500; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--dash-muted); margin-bottom: 0.6rem;
  display: flex; align-items: center; justify-content: space-between;
`;
const KpiLabelHi = styled(KpiLabel)`color: rgba(255,255,255,0.75);`;
const KpiValue = styled.p`
  font-size: 1.6rem; font-weight: 700; color: var(--dash-heading); line-height: 1;
  letter-spacing: -0.02em;
`;
const KpiValueHi = styled(KpiValue)`color: #fff;`;
const KpiSub = styled.span`
  display: block; font-size: 0.75rem; color: var(--dash-muted); margin-top: 0.4rem;
`;
const KpiSubHi = styled(KpiSub)`color: rgba(255,255,255,0.65);`;
const KpiIconBox = styled.div`
  padding: 0.35rem; border-radius: 0.4rem; display: flex; align-items: center;
  background: ${p => p.$bg || 'var(--dash-primary-soft)'};
  color: ${p => p.$color || 'var(--dash-primary)'};
`;

// ─────────────────────────────────────────────────────────────
// PANEL BASE
// ─────────────────────────────────────────────────────────────

const Panel = styled.div`
  background: var(--dash-surface); padding: 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
  animation: ${fadeIn} 0.4s ease both;
`;
const PanelHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem;
`;
const PanelTitle = styled.div`
  h2 { font-size: 1rem; font-weight: 700; color: var(--dash-heading); }
  p  { font-size: 0.8rem; color: var(--dash-muted); margin-top: 0.2rem; }
`;
const AddButton = styled.button`
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 1rem; border: none; border-radius: 0.65rem; cursor: pointer;
  font-size: 0.8rem; font-weight: 700; color: #fff;
  background: ${p => p.$color
    ? `linear-gradient(135deg, ${p.$color}cc, ${p.$color})`
    : 'linear-gradient(135deg, #7F77DD, #5b67ff)'};
  box-shadow: 0 8px 20px ${p => p.$color ? p.$color + '44' : 'rgba(127,119,221,0.3)'};
  transition: transform 0.2s, filter 0.2s;
  &:hover { transform: translateY(-2px); filter: brightness(1.08); }
  flex-shrink: 0;
`;

// ─────────────────────────────────────────────────────────────
// CARTEIRA — lista de investimentos
// ─────────────────────────────────────────────────────────────

const InvList = styled.div`display: flex; flex-direction: column; gap: 0.65rem;`;

const InvRow = styled.div`
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.1rem; background: var(--dash-surface-muted);
  border: 1px solid var(--dash-border); border-radius: 0.75rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: var(--dash-border-strong); box-shadow: var(--dash-soft-shadow); }
  @media (max-width: 600px) { flex-wrap: wrap; }
`;
const InvBadge = styled.div`
  width: 2.8rem; height: 2.8rem; border-radius: 0.8rem; display: grid; place-items: center;
  font-size: 1.2rem; flex-shrink: 0;
  background: ${p => p.$cor + '22'};
  box-shadow: inset 0 0 0 1px ${p => p.$cor + '44'};
`;
const InvMeta = styled.div`flex: 1; min-width: 0;`;
const InvName = styled.strong`
  display: block; font-size: 0.9rem; color: var(--dash-heading); font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const InvType = styled.span`
  display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem;
  border-radius: 999px; color: ${p => p.$cor}; background: ${p => p.$cor + '22'};
  margin-top: 0.2rem; margin-right: 0.4rem;
`;
const InvTaxa = styled.span`
  font-size: 0.75rem; color: var(--dash-muted);
`;
const InvStats = styled.div`
  display: flex; gap: 1.5rem; flex-shrink: 0;
  @media (max-width: 600px) { width: 100%; margin-top: 0.5rem; }
`;
const InvStat = styled.div`
  text-align: right;
  span   { display: block; font-size: 0.68rem; color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  strong { display: block; font-size: 0.95rem; font-weight: 700; color: var(--dash-heading); margin-top: 0.15rem; }
`;
const InvRendimento = styled(InvStat)`
  strong { color: ${p => p.$negative ? '#ef4444' : '#10b981'}; }
`;
const InvActions = styled.div`
  display: flex; gap: 0.35rem; flex-shrink: 0;
`;
const IconBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  padding: 0.4rem; border: none; border-radius: 0.4rem; cursor: pointer;
  background: none; color: var(--dash-muted); transition: all 0.15s;
  &:hover { background: ${p => p.$danger ? 'var(--dash-danger-soft)' : 'var(--dash-primary-soft)'};
    color: ${p => p.$danger ? '#ef4444' : 'var(--dash-primary)'}; }
`;

const InvTotal = styled.div`
  margin-top: 1rem; padding: 0.85rem 1.1rem;
  background: var(--dash-table-head); border-radius: 0.65rem;
  border: 1px solid var(--dash-border);
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.85rem; color: var(--dash-muted-strong); font-weight: 600;
  strong { font-size: 1rem; color: var(--dash-heading); }
`;

const EmptyState = styled.div`
  text-align: center; padding: 3rem 1rem; color: var(--dash-muted);
  font-size: 0.875rem; display: flex; flex-direction: column; align-items: center;
  p { margin-top: 0.5rem; font-size: 0.8rem; }
`;

// ─────────────────────────────────────────────────────────────
// ALOCAÇÃO POR TIPO — donut chart
// ─────────────────────────────────────────────────────────────

const AllocGrid = styled.div`
  display: grid; gap: 1.5rem; align-items: center;
  grid-template-columns: 1fr;
  @media (min-width: 580px) { grid-template-columns: 200px 1fr; }
`;
const AllocDonut = styled.div`height: 200px;`;
const AllocLegend = styled.div`
  display: flex; flex-direction: column; gap: 0.6rem;
`;
const AllocItem = styled.div`
  display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem;
`;
const AllocDot = styled.div`
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  background: ${p => p.$color};
`;
const AllocName = styled.span`flex: 1; color: var(--dash-text);`;
const AllocValue = styled.span`color: var(--dash-heading); font-weight: 600;`;
const AllocPct = styled.span`color: var(--dash-muted); font-size: 0.75rem; margin-left: 0.25rem;`;

// ─────────────────────────────────────────────────────────────
// FILTRO DE TIPO — seletor acima da lista de investimentos
// ─────────────────────────────────────────────────────────────

const FilterBar = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.875rem; flex-wrap: wrap;
`;
const FilterChip = styled.button`
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  border: 1.5px solid ${p => p.$active ? p.$color || 'var(--dash-primary)' : 'var(--dash-border)'};
  background: ${p => p.$active ? (p.$color ? p.$color + '22' : 'var(--dash-primary-soft)') : 'transparent'};
  color: ${p => p.$active ? (p.$color || 'var(--dash-primary)') : 'var(--dash-muted)'};
  &:hover { border-color: ${p => p.$color || 'var(--dash-primary)'}; }
`;

// ─────────────────────────────────────────────────────────────
// COFRINHOS — grid de metas
// ─────────────────────────────────────────────────────────────

const CofrinhoGrid = styled.div`
  display: grid; gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); }
`;
const CofrinhoCard = styled.div`
  background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  border-radius: 0.875rem; padding: 1.1rem; position: relative;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  &:hover { border-color: var(--dash-border-strong); transform: translateY(-2px); box-shadow: var(--dash-soft-shadow); }
`;
const CofrinhoTopRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem;
`;
const CofrinhoEmoji = styled.div`
  width: 2.8rem; height: 2.8rem; border-radius: 0.75rem; display: grid; place-items: center;
  font-size: 1.4rem; background: ${p => p.$cor + '22'};
  box-shadow: inset 0 0 0 1px ${p => p.$cor + '44'};
`;
const CofrinhoMenuBtn = styled.button`
  background: none; border: none; cursor: pointer; padding: 0.2rem; border-radius: 0.35rem;
  color: var(--dash-muted); transition: all 0.15s;
  &:hover { background: var(--dash-primary-soft); color: var(--dash-primary); }
`;
const CofrinhoName = styled.strong`
  display: block; font-size: 0.9rem; font-weight: 700; color: var(--dash-heading);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const CofrinhoValues = styled.div`
  display: flex; align-items: baseline; gap: 0.3rem; margin: 0.35rem 0 0.6rem;
  strong { font-size: 1.05rem; font-weight: 700; color: var(--dash-heading); }
  span   { font-size: 0.75rem; color: var(--dash-muted); }
`;
const ProgressTrack = styled.div`
  height: 6px; border-radius: 999px; background: var(--dash-border); overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%; border-radius: 999px;
  width: ${p => Math.min(p.$pct, 100)}%;
  background: ${p => p.$cor};
  transition: width 0.5s ease;
`;
const CofrinhoFooter = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-top: 0.65rem;
`;
const CofrinhoMeta = styled.span`
  font-size: 0.72rem; color: var(--dash-muted);
  strong { color: var(--dash-muted-strong); font-weight: 600; }
`;
const CofrinhoAction = styled.button`
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.7rem; border: none; border-radius: 0.5rem; cursor: pointer;
  font-size: 0.72rem; font-weight: 700; color: ${p => p.$cor || 'var(--dash-primary)'};
  background: ${p => (p.$cor || '#3b82f6') + '18'};
  transition: all 0.15s; flex-shrink: 0;
  &:hover { filter: brightness(1.1); background: ${p => (p.$cor || '#3b82f6') + '30'}; }
`;
const CofrinhoConcluidoBadge = styled.div`
  position: absolute; top: 0.5rem; right: 0.5rem; display: flex; align-items: center; gap: 0.2rem;
  font-size: 0.65rem; font-weight: 700; color: #10b981;
  background: #10b98122; padding: 0.15rem 0.45rem; border-radius: 999px;
`;

// ─────────────────────────────────────────────────────────────
// EVOLUÇÃO PATRIMONIAL — chart
// ─────────────────────────────────────────────────────────────

const ChartWrap = styled.div`height: 260px; margin-top: 0.5rem;`;
const ChartTooltipBox = styled.div`
  background: var(--dash-surface); border: 1px solid var(--dash-border);
  padding: 0.65rem 0.9rem; border-radius: 0.5rem; font-size: 0.78rem;
  box-shadow: var(--dash-soft-shadow);
  p { color: var(--dash-muted); margin-bottom: 0.2rem; }
  strong { color: var(--dash-heading); }
`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox>
      <p>{label}</p>
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
          <strong>{e.name}: {fmt(e.value)}</strong>
        </div>
      ))}
    </ChartTooltipBox>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAIS
// ─────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(15,23,42,0.72);
  display: flex; align-items: center; justify-content: center; z-index: 200;
`;
const ModalBox = styled.div`
  background: var(--dash-surface); padding: 2rem; border-radius: 1rem;
  width: 100%; max-width: ${p => p.$sm ? '380px' : '460px'};
  max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-shadow);
  animation: ${popIn} 0.2s ease;
`;
const ModalHead = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
  h3 { font-size: 1.1rem; font-weight: 700; color: var(--dash-heading); }
  button { background: none; border: none; cursor: pointer; color: var(--dash-muted); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--dash-heading); } }
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.875rem;
  label { font-size: 0.72rem; font-weight: 700; color: var(--dash-muted-strong); text-transform: uppercase; letter-spacing: 0.03em; }
  input, select {
    padding: 0.7rem 0.875rem; border: 1px solid var(--dash-border); border-radius: 0.5rem;
    font-size: 0.875rem; outline: none; background: var(--dash-input-bg); transition: all 0.15s;
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); appearance: none;
    &:focus { border-color: var(--dash-primary); background: var(--dash-surface); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  select option { color: var(--dash-heading); background: var(--dash-surface); }
`;
const FormRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
`;
const ModalFoot = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;
  button {
    padding: 0.55rem 1.25rem; border-radius: 0.5rem; font-weight: 600;
    cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.15s;
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }
  .cancel { background: var(--dash-surface-muted); color: var(--dash-text); &:hover { filter: brightness(1.04); } }
  .save   { background: linear-gradient(135deg,#7F77DD,#5b67ff); color: #fff; &:hover { filter: brightness(1.07); } }
  .danger { background: #ef4444; color: #fff; &:hover { background: #dc2626; } }
`;

const IconPicker = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.25rem;
`;
const IconBtn2 = styled.button`
  width: 2.2rem; height: 2.2rem; border-radius: 0.5rem; font-size: 1rem;
  border: 1.5px solid ${p => p.$selected ? 'var(--dash-primary)' : 'var(--dash-border)'};
  background: ${p => p.$selected ? 'var(--dash-primary-soft)' : 'var(--dash-input-bg)'};
  cursor: pointer; transition: all 0.12s; display: grid; place-items: center;
  &:hover { border-color: var(--dash-primary); }
`;
const ColorPicker = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.25rem;
`;
const ColorDot = styled.button`
  width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid ${p => p.$selected ? 'var(--dash-heading)' : 'transparent'};
  background: ${p => p.$color}; cursor: pointer; outline: none; transition: transform 0.12s;
  &:hover { transform: scale(1.15); }
`;

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed; bottom: 2rem; right: 2rem; z-index: 300;
  display: flex; flex-direction: column; gap: 0.5rem;
`;
const Toast = styled.div`
  background: ${p => p.$type === 'error' ? '#ef4444' : '#10b981'};
  color: #fff; padding: 0.875rem 1.25rem; border-radius: 0.5rem;
  font-weight: 500; font-size: 0.875rem; min-width: 240px;
  display: flex; align-items: center; gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15); animation: ${slideIn} 0.25s ease-out;
`;

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function Investimentos() {
  const navigate   = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // ── State de dados (API) ──────────────────────────────────
  const [investimentos, setInvestimentos] = useState([]);
  const [cofrinhos, setCofrinhos]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  // ── UI ────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

  // ── Modal: novo investimento ──────────────────────────────
  const [invModal, setInvModal]   = useState(false);
  const [invEdit, setInvEdit]     = useState(null);
  const [invForm, setInvForm]     = useState({ tipo: 'CDB', nome: '', taxa: '', valor: '', rendimento: '', mesInicio: '', prazo: '' });
  const [invDelId, setInvDelId]   = useState(null);
  const [invFiltro, setInvFiltro] = useState('');

  // ── Modal: novo cofrinho ──────────────────────────────────
  const [cofModal, setCofModal]   = useState(false);
  const [cofEdit, setCofEdit]     = useState(null);
  const [cofForm, setCofForm]     = useState({ nome: '', icone: '✈️', cor: '#3b82f6', meta: '', prazo: '' });
  const [cofDelId, setCofDelId]   = useState(null);

  // ── Modal: depositar cofrinho ─────────────────────────────
  const [depModal, setDepModal]   = useState(null); // { id, nome, cor }
  const [depValor, setDepValor]   = useState('');
  const [depMode, setDepMode]     = useState('depositar'); // 'depositar' | 'sacar'

  // ── Helpers ──────────────────────────────────────────────
  const notify = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  // ── Carga inicial via API ─────────────────────────────────
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resInv, resCof] = await Promise.all([
        listarInvestimentos(),
        listarCofrinhos(),
      ]);
      setInvestimentos(resInv.investimentos || []);
      setCofrinhos(resCof.cofrinhos || []);
    } catch (err) {
      notify('Erro ao carregar dados. Tente recarregar a página.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ── KPIs calculados ──────────────────────────────────────
  const patrimonioInv   = investimentos.reduce((s, i) => s + i.valor + (i.rendimento || 0), 0);
  const patrimonioMeta  = cofrinhos.reduce((s, c) => s + c.atual, 0);
  const patrimonioTotal = patrimonioInv + patrimonioMeta;
  const rendimentoTotal = investimentos.reduce((s, i) => s + (i.rendimento || 0), 0);

  // Aporte do mês corrente (soma dos investimentos com mesInicio = mês atual)
  const mesAtual = new Date().toISOString().slice(0, 7);
  const aporteMes = investimentos
    .filter(i => i.mesInicio === mesAtual)
    .reduce((s, i) => s + i.valor, 0);

  // Dados do gráfico de evolução derivados dos investimentos reais
  const evolucao = derivarEvolucao(investimentos);

  // ── CRUD Investimentos ────────────────────────────────────
  function openInvModal(inv = null) {
    if (inv) {
      setInvEdit(inv.id);
      setInvForm({ tipo: inv.tipo, nome: inv.nome, taxa: inv.taxa, valor: String(inv.valor), mesInicio: inv.mesInicio });
    } else {
      setInvEdit(null);
      setInvForm({ tipo: 'CDB', nome: '', taxa: '', valor: '', mesInicio: mesAtual });
    }
    setInvModal(true);
  }

  async function saveInv() {
    const valor = Number(invForm.valor);
    if (!invForm.nome.trim() || !valor || valor <= 0) { notify('Preencha nome e valor.', 'error'); return; }
    setSaving(true);
    try {
      if (invEdit) {
        const atualizado = await atualizarInvestimento(invEdit, { ...invForm, valor });
        setInvestimentos(prev => prev.map(i => i.id === invEdit ? atualizado : i));
        notify('Investimento atualizado.');
      } else {
        const novo = await criarInvestimento({ ...invForm, valor });
        setInvestimentos(prev => [...prev, novo]);
        notify('Investimento registrado!');
      }
      setInvModal(false);
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao salvar investimento.';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteInv() {
    setSaving(true);
    try {
      await removerInvestimento(invDelId);
      setInvestimentos(prev => prev.filter(i => i.id !== invDelId));
      notify('Investimento removido.');
    } catch {
      notify('Erro ao remover investimento.', 'error');
    } finally {
      setSaving(false);
      setInvDelId(null);
    }
  }

  // ── CRUD Cofrinhos ────────────────────────────────────────
  function openCofModal(cof = null) {
    if (cof) {
      setCofEdit(cof.id);
      setCofForm({ nome: cof.nome, icone: cof.icone, cor: cof.cor, meta: String(cof.meta), prazo: cof.prazo || '' });
    } else {
      setCofEdit(null);
      setCofForm({ nome: '', icone: '✈️', cor: '#3b82f6', meta: '', prazo: '' });
    }
    setCofModal(true);
  }

  async function saveCof() {
    const meta = Number(cofForm.meta);
    if (!cofForm.nome.trim() || !meta || meta <= 0) { notify('Preencha nome e meta.', 'error'); return; }
    setSaving(true);
    try {
      if (cofEdit) {
        const atualizado = await atualizarCofrinho(cofEdit, { ...cofForm, meta });
        setCofrinhos(prev => prev.map(c => c.id === cofEdit ? atualizado : c));
        notify('Cofrinho atualizado.');
      } else {
        const novo = await criarCofrinho({ ...cofForm, meta });
        setCofrinhos(prev => [...prev, novo]);
        notify('Cofrinho criado!');
      }
      setCofModal(false);
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao salvar cofrinho.';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCof() {
    setSaving(true);
    try {
      await removerCofrinho(cofDelId);
      setCofrinhos(prev => prev.filter(c => c.id !== cofDelId));
      notify('Cofrinho removido.');
    } catch {
      notify('Erro ao remover cofrinho.', 'error');
    } finally {
      setSaving(false);
      setCofDelId(null);
    }
  }

  // ── Depositar / Sacar cofrinho ────────────────────────────
  async function depositar() {
    const v = Number(depValor);
    if (!v || v === 0) { notify('Informe um valor diferente de zero.', 'error'); return; }
    setSaving(true);
    try {
      const atualizado = await depositarCofrinho(depModal.id, v);
      setCofrinhos(prev => prev.map(c => c.id === depModal.id ? atualizado : c));
      setDepModal(null);
      setDepValor('');
      notify(v > 0 ? 'Depósito registrado!' : 'Retirada registrada.');
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao movimentar cofrinho.';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <AppContainer $dark={isDark}>

      {/* ── Sidebar ── */}
      <MobileOverlay $visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      <Sidebar $open={sidebarOpen}>
        <LogoArea>
          <Wallet size={22} />
          <span>WebWallet</span>
        </LogoArea>
        <NavMenu>
          <NavItem onClick={() => navigate('/dashboard')}>
            <Home size={18} /> Dashboard
          </NavItem>
          <NavItem $active onClick={() => {}}>
            <TrendingUp size={18} /> Investimentos
          </NavItem>
          <NavItem onClick={() => navigate('/relatorios')}>
            <FileText size={18} /> Relatórios
          </NavItem>
          <NavItem onClick={() => navigate('/configuracoes')}>
            <Settings size={18} /> Configurações
          </NavItem>
        </NavMenu>
        <SidebarFooter>
          <LogoutButton onClick={logout}>
            <LogOut size={18} /> Sair
          </LogoutButton>
          <ThemeToggleBox $dark={isDark} onClick={toggleTheme}>
            <ThemeToggleMeta>
              {isDark ? <Moon size={18} /> : <SunMedium size={18} />}
              <div>
                <strong>{isDark ? 'Modo escuro' : 'Modo claro'}</strong>
                <span>Alterar tema</span>
              </div>
            </ThemeToggleMeta>
            <SwitchTrack $on={isDark} $dark={isDark}>
              <SwitchThumb $on={isDark}>
                {isDark ? <Moon size={10} /> : <SunMedium size={10} />}
              </SwitchThumb>
            </SwitchTrack>
          </ThemeToggleBox>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main ── */}
      <MainContent>
        <TopBar>
          <TopBarLeft>
            <MobileMenuBtn onClick={() => setSidebarOpen(true)}><Menu size={22} /></MobileMenuBtn>
            <PageTitle>
              <h1>Investimentos</h1>
              <p>Carteira, cofrinhos e evolução patrimonial</p>
            </PageTitle>
          </TopBarLeft>
        </TopBar>

        <ContentArea>
          <ContentWrapper>

            {/* ── Loading overlay ── */}
            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4rem', color: 'var(--dash-muted)', fontSize: '0.9rem', gap: '0.5rem',
              }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                Carregando seus dados…
              </div>
            )}

            {!loading && <>

            {/* ── KPIs ── */}
            <KpiGrid>
              <KpiHighlight>
                <KpiLabelHi>
                  Patrimônio Total
                  <KpiIconBox $bg="rgba(255,255,255,0.2)" $color="#fff"><Landmark size={16} /></KpiIconBox>
                </KpiLabelHi>
                <KpiValueHi>{fmt(patrimonioTotal)}</KpiValueHi>
                <KpiSubHi>investimentos + cofrinhos</KpiSubHi>
              </KpiHighlight>

              <KpiCard>
                <KpiLabel>
                  Aporte do Mês
                  <KpiIconBox $bg="#dbeafe" $color="#2563eb"><ArrowUpCircle size={16} /></KpiIconBox>
                </KpiLabel>
                <KpiValue>{aporteMes > 0 ? fmt(aporteMes) : '—'}</KpiValue>
                <KpiSub>
                  {new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
                    .format(new Date()).replace('.', '')}
                </KpiSub>
              </KpiCard>

              <KpiCard>
                <KpiLabel>
                  Rendimento Acumulado
                  <KpiIconBox $bg="#dcfce7" $color="#16a34a"><TrendingUp size={16} /></KpiIconBox>
                </KpiLabel>
                <KpiValue style={{ color: '#10b981' }}>{rendimentoTotal > 0 ? fmt(rendimentoTotal) : '—'}</KpiValue>
                <KpiSub>em investimentos</KpiSub>
              </KpiCard>

              <KpiCard>
                <KpiLabel>
                  Total em Cofrinhos
                  <KpiIconBox $bg="#ede9fe" $color="#7c3aed"><Target size={16} /></KpiIconBox>
                </KpiLabel>
                <KpiValue>{fmt(patrimonioMeta)}</KpiValue>
                <KpiSub>{cofrinhos.length} cofrinho{cofrinhos.length !== 1 ? 's' : ''} ativos</KpiSub>
              </KpiCard>
            </KpiGrid>

            {/* ── Carteira ── */}
            <Panel>
              <PanelHeader>
                <PanelTitle>
                  <h2>Minha Carteira</h2>
                  <p>Seus investimentos por tipo de ativo</p>
                </PanelTitle>
                <AddButton onClick={() => openInvModal()}>
                  <Plus size={14} /> Investimento
                </AddButton>
              </PanelHeader>

              {investimentos.length === 0 ? (
                <EmptyState>
                  <Coins size={36} strokeWidth={1.2} />
                  <p>Nenhum investimento registrado ainda.</p>
                </EmptyState>
              ) : (
                <>
                  <InvList>
                    {investimentos.map(inv => {
                      const tipo = tipoInfo(inv.tipo);
                      return (
                        <InvRow key={inv.id}>
                          <InvBadge $cor={tipo.cor}>{tipo.icone}</InvBadge>
                          <InvMeta>
                            <InvName>{inv.nome}</InvName>
                            <div>
                              <InvType $cor={tipo.cor}>{tipo.label}</InvType>
                              <InvTaxa>{inv.taxa}</InvTaxa>
                            </div>
                          </InvMeta>
                          <InvStats>
                            <InvStat>
                              <span>Aportado</span>
                              <strong>{fmt(inv.valor)}</strong>
                            </InvStat>
                            <InvRendimento>
                              <span>Rendimento</span>
                              <strong>+{fmt(inv.rendimento)}</strong>
                            </InvRendimento>
                          </InvStats>
                          <InvActions>
                            <IconBtn onClick={() => openInvModal(inv)} title="Editar">
                              <Edit2 size={15} />
                            </IconBtn>
                            <IconBtn $danger onClick={() => setInvDelId(inv.id)} title="Excluir">
                              <Trash2 size={15} />
                            </IconBtn>
                          </InvActions>
                        </InvRow>
                      );
                    })}
                  </InvList>
                  <InvTotal>
                    <span>Total investido (aporte + rendimento)</span>
                    <strong>{fmt(patrimonioInv)}</strong>
                  </InvTotal>
                </>
              )}
            </Panel>

            {/* ── Cofrinhos ── */}
            <Panel>
              <PanelHeader>
                <PanelTitle>
                  <h2>Cofrinhos</h2>
                  <p>Metas para viagens, compras e objetivos pessoais</p>
                </PanelTitle>
                <AddButton $color="#ec4899" onClick={() => openCofModal()}>
                  <Plus size={14} /> Cofrinho
                </AddButton>
              </PanelHeader>

              {cofrinhos.length === 0 ? (
                <EmptyState>
                  <PiggyBank size={36} strokeWidth={1.2} />
                  <p>Nenhum cofrinho criado ainda.</p>
                </EmptyState>
              ) : (
                <CofrinhoGrid>
                  {cofrinhos.map(cof => {
                    const pct  = cof.meta > 0 ? (cof.atual / cof.meta) * 100 : 0;
                    const cor  = cof.cor;
                    const done = pct >= 100;
                    const meses = mesesRestantes(cof.prazo);
                    return (
                      <CofrinhoCard key={cof.id}>
                        {done && (
                          <CofrinhoConcluidoBadge>
                            <CheckCircle size={10} /> Concluído
                          </CofrinhoConcluidoBadge>
                        )}
                        <CofrinhoTopRow>
                          <CofrinhoEmoji $cor={cor}>{cof.icone}</CofrinhoEmoji>
                          <CofrinhoMenuBtn onClick={() => openCofModal(cof)} title="Editar">
                            <Edit2 size={14} />
                          </CofrinhoMenuBtn>
                        </CofrinhoTopRow>
                        <CofrinhoName>{cof.nome}</CofrinhoName>
                        <CofrinhoValues>
                          <strong>{fmt(cof.atual)}</strong>
                          <span>de {fmt(cof.meta)}</span>
                        </CofrinhoValues>
                        <ProgressTrack>
                          <ProgressFill $pct={pct} $cor={done ? '#10b981' : cor} />
                        </ProgressTrack>
                        <CofrinhoFooter>
                          <div>
                            <CofrinhoMeta>
                              <strong>{fmtPct(Math.min(pct, 100))}</strong>
                            </CofrinhoMeta>
                            {cof.prazo && meses !== null && (
                              <CofrinhoMeta style={{ display: 'block', marginTop: '0.1rem' }}>
                                {meses > 0 ? `${meses}m restantes` : '⚠ prazo encerrado'}
                              </CofrinhoMeta>
                            )}
                          </div>
                          <CofrinhoAction
                            $cor={cor}
                            onClick={() => { setDepModal({ id: cof.id, nome: cof.nome, cor }); setDepValor(''); }}
                          >
                            <Plus size={11} /> Depositar
                          </CofrinhoAction>
                        </CofrinhoFooter>
                      </CofrinhoCard>
                    );
                  })}
                </CofrinhoGrid>
              )}
            </Panel>

            {/* ── Evolução Patrimonial ── */}
            <Panel>
              <PanelHeader>
                <PanelTitle>
                  <h2>Evolução Patrimonial</h2>
                  <p>Aportes mensais e patrimônio acumulado — últimos 6 meses</p>
                </PanelTitle>
              </PanelHeader>
              <ChartWrap>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucao} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: 'var(--dash-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: 'var(--dash-muted)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="aporte" name="Aporte" fill="var(--dash-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.85} />
                    <Area
                      type="monotone" dataKey="patrimonio" name="Patrimônio"
                      fill="rgba(127,119,221,0.12)" stroke="#7F77DD"
                      strokeWidth={2.5} dot={{ r: 4, fill: '#7F77DD', strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartWrap>
            </Panel>

            </>}

          </ContentWrapper>
        </ContentArea>
      </MainContent>

      {/* ── Toasts ── */}
      {toast.show && (
        <ToastContainer>
          <Toast $type={toast.type}>
            {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </Toast>
        </ToastContainer>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Novo / Editar Investimento
      ════════════════════════════════════════════════════ */}
      {invModal && (
        <Overlay>
          <ModalBox>
            <ModalHead>
              <h3>{invEdit ? 'Editar investimento' : 'Novo investimento'}</h3>
              <button onClick={() => setInvModal(false)}><X size={18} /></button>
            </ModalHead>

            <FormGroup>
              <label>Tipo de ativo</label>
              <select value={invForm.tipo} onChange={e => setInvForm(f => ({ ...f, tipo: e.target.value }))}>
                {TIPOS_INVESTIMENTO.map(t => (
                  <option key={t.key} value={t.key}>{t.icone} {t.label}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup>
              <label>Nome / Descrição</label>
              <input
                placeholder="Ex: CDB Banco Inter 110% CDI"
                value={invForm.nome}
                onChange={e => setInvForm(f => ({ ...f, nome: e.target.value }))}
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <label>Taxa / Indexador</label>
                <input
                  placeholder="Ex: 110% CDI"
                  value={invForm.taxa}
                  onChange={e => setInvForm(f => ({ ...f, taxa: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <label>Mês de início</label>
                <input
                  type="month"
                  value={invForm.mesInicio}
                  onChange={e => setInvForm(f => ({ ...f, mesInicio: e.target.value }))}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <label>Valor aportado (R$)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={invForm.valor}
                onChange={e => setInvForm(f => ({ ...f, valor: e.target.value }))}
              />
            </FormGroup>

            <ModalFoot>
              <button className="cancel" disabled={saving} onClick={() => setInvModal(false)}>Cancelar</button>
              <button className="save" disabled={saving} onClick={saveInv}>
                {saving ? 'Salvando…' : invEdit ? 'Salvar' : 'Registrar'}
              </button>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Novo / Editar Cofrinho
      ════════════════════════════════════════════════════ */}
      {cofModal && (
        <Overlay>
          <ModalBox>
            <ModalHead>
              <h3>{cofEdit ? 'Editar cofrinho' : 'Novo cofrinho'}</h3>
              <button onClick={() => setCofModal(false)}><X size={18} /></button>
            </ModalHead>

            <FormGroup>
              <label>Nome da meta</label>
              <input
                placeholder="Ex: Viagem Europa"
                value={cofForm.nome}
                onChange={e => setCofForm(f => ({ ...f, nome: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <label>Ícone</label>
              <IconPicker>
                {ICONES_COFRINHO.map(ic => (
                  <IconBtn2
                    key={ic} $selected={cofForm.icone === ic}
                    onClick={() => setCofForm(f => ({ ...f, icone: ic }))}
                  >{ic}</IconBtn2>
                ))}
              </IconPicker>
            </FormGroup>

            <FormGroup>
              <label>Cor</label>
              <ColorPicker>
                {CORES_COFRINHO.map(cor => (
                  <ColorDot
                    key={cor} $color={cor} $selected={cofForm.cor === cor}
                    onClick={() => setCofForm(f => ({ ...f, cor }))}
                  />
                ))}
              </ColorPicker>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <label>Meta (R$)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={cofForm.meta}
                  onChange={e => setCofForm(f => ({ ...f, meta: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <label>Prazo (opcional)</label>
                <input
                  type="month"
                  value={cofForm.prazo}
                  onChange={e => setCofForm(f => ({ ...f, prazo: e.target.value }))}
                />
              </FormGroup>
            </FormRow>

            <ModalFoot>
              <button className="cancel" disabled={saving} onClick={() => setCofModal(false)}>Cancelar</button>
              {cofEdit && (
                <button className="danger" disabled={saving} onClick={() => { setCofDelId(cofEdit); setCofModal(false); }}>
                  Excluir
                </button>
              )}
              <button className="save" disabled={saving} onClick={saveCof}>
                {saving ? 'Salvando…' : cofEdit ? 'Salvar' : 'Criar'}
              </button>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Depositar / Sacar cofrinho
      ════════════════════════════════════════════════════ */}
      {depModal && (
        <Overlay>
          <ModalBox $sm>
            <ModalHead>
              <h3>Movimentar cofrinho</h3>
              <button onClick={() => setDepModal(null)}><X size={18} /></button>
            </ModalHead>
            <p style={{ fontSize: '0.85rem', color: 'var(--dash-muted)', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--dash-heading)' }}>{depModal.nome}</strong>
              {' '}— Informe um valor positivo para depositar ou negativo para sacar.
            </p>
            <FormGroup>
              <label>Valor (R$)</label>
              <input
                type="number" step="0.01" placeholder="Ex: 500 ou -200"
                value={depValor}
                autoFocus
                onChange={e => setDepValor(e.target.value)}
              />
            </FormGroup>
            <ModalFoot>
              <button className="cancel" disabled={saving} onClick={() => setDepModal(null)}>Cancelar</button>
              <button
                className="save"
                disabled={saving}
                style={{ background: `linear-gradient(135deg,${depModal.cor}cc,${depModal.cor})` }}
                onClick={depositar}
              >
                {saving ? 'Aguarde…' : 'Confirmar'}
              </button>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Confirmar exclusão de investimento
      ════════════════════════════════════════════════════ */}
      {invDelId && (
        <Overlay>
          <ModalBox $sm>
            <ModalHead>
              <h3>Excluir investimento</h3>
              <button onClick={() => setInvDelId(null)}><X size={18} /></button>
            </ModalHead>
            <p style={{ fontSize: '0.875rem', color: 'var(--dash-text)', lineHeight: 1.6 }}>
              Tem certeza? <strong style={{ color: 'var(--dash-heading)' }}>Esta ação não pode ser desfeita.</strong>
            </p>
            <ModalFoot>
              <button className="cancel" disabled={saving} onClick={() => setInvDelId(null)}>Cancelar</button>
              <button className="danger" disabled={saving} onClick={deleteInv}>
                {saving ? 'Removendo…' : 'Excluir'}
              </button>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Confirmar exclusão de cofrinho
      ════════════════════════════════════════════════════ */}
      {cofDelId && (
        <Overlay>
          <ModalBox $sm>
            <ModalHead>
              <h3>Excluir cofrinho</h3>
              <button onClick={() => setCofDelId(null)}><X size={18} /></button>
            </ModalHead>
            <p style={{ fontSize: '0.875rem', color: 'var(--dash-text)', lineHeight: 1.6 }}>
              Tem certeza? <strong style={{ color: 'var(--dash-heading)' }}>Esta ação não pode ser desfeita.</strong>
            </p>
            <ModalFoot>
              <button className="cancel" disabled={saving} onClick={() => setCofDelId(null)}>Cancelar</button>
              <button className="danger" disabled={saving} onClick={deleteCof}>
                {saving ? 'Removendo…' : 'Excluir'}
              </button>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

    </AppContainer>
  );
}
