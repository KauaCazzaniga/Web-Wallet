import React, { useState, useEffect, useCallback, useContext } from "react";
import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Home, ArrowUpCircle, ArrowDownCircle, Wallet,
  Plus, AlertTriangle, X, Trash2, Settings, FileText, CheckCircle, LogOut, Moon, SunMedium, Sparkles
} from "lucide-react";

// ==========================================
// ANIMAÇÕES
// ==========================================
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ==========================================
// TOASTS
// ==========================================
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

// ==========================================
// MODAIS
// ==========================================
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background-color: rgba(15,23,42,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background: var(--dash-surface); padding: 2rem; border-radius: 1rem;
  width: 100%; max-width: ${p => p.$sm ? '380px' : '450px'};
  max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--dash-border);
  box-shadow: var(--dash-shadow); animation: ${fadeIn} 0.2s ease;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 600; color: var(--dash-heading); }
  button { background: none; border: none; cursor: pointer; color: var(--dash-muted); padding: 0.25rem; border-radius: 0.25rem; &:hover { color: var(--dash-heading); } }
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.875rem;
  label { font-size: 0.75rem; font-weight: 600; color: var(--dash-muted-strong); text-transform: uppercase; letter-spacing: 0.03em; }
  input, select {
    padding: 0.7rem 0.875rem; border: 1px solid var(--dash-border); border-radius: 0.5rem;
    font-size: 0.875rem; outline: none; background: var(--dash-input-bg); transition: all 0.15s;
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); appearance: none;
    &:focus { border-color: var(--dash-primary); background: var(--dash-surface); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  select option {
    color: var(--dash-heading);
    background: var(--dash-surface);
  }
`;
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;
  button {
    padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 500;
    cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.15s;
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }
  .cancel { background: var(--dash-surface-muted); color: var(--dash-text); &:hover { filter: brightness(1.04); } }
  .save   { background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%); color: #fff; &:hover { filter: brightness(1.05); } }
  .danger { background: #ef4444; color: #fff;    &:hover { background: #dc2626; } }
`;
const GoalItem = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem; background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  border-radius: 0.75rem; margin-bottom: 0.65rem; gap: 0.75rem;
  box-shadow: var(--dash-soft-shadow);
  .goal-info {
    display: flex; align-items: center; gap: 0.9rem; flex: 1; min-width: 0;
  }
  span { font-size: 0.95rem; white-space: nowrap; color: var(--dash-heading); }
  input {
    width: 180px; padding: 0.6rem 0.8rem; border: 1px solid var(--dash-border-strong);
    border-radius: 0.625rem; font-size: 0.875rem; outline: none; background: var(--dash-input-bg);
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading);
    &:focus { border-color: var(--dash-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  button { color: #ef4444; border: none; background: none; cursor: pointer; padding: 0.35rem; border-radius: 0.375rem; &:hover { background: #fef2f2; } }
`;

// ==========================================
// LAYOUT
// ==========================================
const AppContainer = styled.div`
  min-height: 100vh; display: flex;
  font-family: "Inter", sans-serif; color: var(--dash-heading);
  background: ${p => p.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 24%), linear-gradient(180deg, #04101f 0%, #071425 45%, #030b15 100%)'
    : 'linear-gradient(180deg, #eff4ff 0%, #f8fbff 100%)'};
  --dash-shell: ${p => p.$dark ? 'rgba(7,18,35,0.92)' : '#ffffff'};
  --dash-surface: ${p => p.$dark ? 'rgba(9,20,38,0.88)' : '#ffffff'};
  --dash-surface-muted: ${p => p.$dark ? 'rgba(13,29,54,0.86)' : '#f6f9ff'};
  --dash-border: ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#d8e3f3'};
  --dash-border-strong: ${p => p.$dark ? 'rgba(96,165,250,0.3)' : '#bfd0ea'};
  --dash-heading: ${p => p.$dark ? '#eff6ff' : '#0f172a'};
  --dash-text: ${p => p.$dark ? '#c6d4f1' : '#334155'};
  --dash-muted: ${p => p.$dark ? '#89a0c7' : '#7184a0'};
  --dash-muted-strong: ${p => p.$dark ? '#bfd0ea' : '#4f5f7a'};
  --dash-primary: ${p => p.$dark ? '#60a5fa' : '#2563eb'};
  --dash-primary-strong: ${p => p.$dark ? '#3b82f6' : '#1d4ed8'};
  --dash-primary-soft: ${p => p.$dark ? 'rgba(96,165,250,0.16)' : '#dbeafe'};
  --dash-input-bg: ${p => p.$dark ? 'rgba(6,18,34,0.92)' : '#f8fbff'};
  --dash-table-head: ${p => p.$dark ? 'rgba(12,25,46,0.88)' : '#f4f8ff'};
  --dash-danger-soft: ${p => p.$dark ? 'rgba(127,29,29,0.3)' : '#fef2f2'};
  --dash-danger-border: ${p => p.$dark ? 'rgba(248,113,113,0.34)' : '#fecaca'};
  --dash-shadow: ${p => p.$dark ? '0 18px 40px rgba(2,12,27,0.38)' : '0 16px 36px rgba(15,23,42,0.08)'};
  --dash-soft-shadow: ${p => p.$dark ? '0 10px 28px rgba(2,12,27,0.3)' : '0 10px 28px rgba(15,23,42,0.05)'};
`;
const Sidebar = styled.aside`
  width: 240px; background: var(--dash-shell); border-right: 1px solid var(--dash-border);
  display: flex; flex-direction: column; padding: 1.5rem 0; flex-shrink: 0;
  backdrop-filter: blur(18px);
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
  color:      ${p => p.$active ? 'var(--dash-primary)' : 'var(--dash-muted)'};
  font-weight:${p => p.$active ? '600' : '400'};
  &:hover { background: ${p => p.$active ? 'var(--dash-primary-soft)' : 'var(--dash-surface-muted)'}; }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const SidebarFooter = styled.div`
  padding: 1rem 0.75rem 0;
  margin-top: auto;
  display: grid;
  gap: 0.75rem;
`;
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
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.16)' : '#d8e3f3'};
  margin-top: 0.65rem;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.05); }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const ThemeToggleMeta = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  span {
    display: block;
    font-size: 0.76rem;
    color: var(--dash-muted);
    margin-top: 0.08rem;
  }
  strong {
    display: block;
    font-size: 0.9rem;
  }
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
  transition: left 0.2s ease;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
`;
const MainContent = styled.main`
  flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
`;
const Header = styled.header`
  height: 60px; background: var(--dash-shell); border-bottom: 1px solid var(--dash-border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.75rem; flex-shrink: 0;
  backdrop-filter: blur(18px);
`;
const HeaderTitle = styled.h2`font-size: 1.125rem; font-weight: 600; color: var(--dash-heading);`;
const AddButton = styled.button`
  background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%);
  color: #fff; padding: 0.5rem 1rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem; transition: background 0.15s;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
  &:hover { filter: brightness(1.05); }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const ContentArea = styled.div`flex: 1; padding: 1.75rem; overflow-y: auto;`;
const ContentWrapper = styled.div`
  max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;
`;

// ==========================================
// KPI CARDS
// ==========================================
const KpiGrid = styled.div`
  display: grid; gap: 1.25rem;
  grid-template-columns: repeat(1, 1fr);
  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); }
`;
const KpiCard = styled.div`
  background: var(--dash-surface); padding: 1.25rem 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
`;
const HighlightCard = styled(KpiCard)`
  background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%);
  border-color: transparent;
  box-shadow: 0 18px 34px rgba(37,99,235,0.26);
`;
const KpiHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;
  h3 { font-size: 0.75rem; font-weight: 500; color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.04em; }
`;
const HiHeader = styled(KpiHeader)`h3 { color: #c7d2fe; }`;
const IconBox = styled.div`
  padding: 0.4rem; border-radius: 0.4rem; display: flex; align-items: center; justify-content: center;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  ${p => p.$t === 'in' && css`background: #f0fdf4; color: #16a34a;`}
  ${p => p.$t === 'out' && css`background: #fef2f2; color: #dc2626;`}
  ${p => p.$t === 'bal' && css`background: rgba(255,255,255,0.2); color: #fff;`}
  &:hover { transform: translateY(-4px) scale(1.08); filter: brightness(1.08); box-shadow: 0 12px 24px rgba(37,99,235,0.18); }
`;
const KpiVal = styled.p`font-size: 1.75rem; font-weight: 700; color: var(--dash-heading); line-height: 1;`;
const HiVal = styled(KpiVal)`color: #fff;`;

// ==========================================
// PAINÉIS
// ==========================================
const MainGrid = styled.div`
  display: grid; gap: 1.25rem;
  grid-template-columns: 1fr;
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
`;
const Panel = styled.div`
  background: var(--dash-surface); padding: 1.5rem; border-radius: 0.875rem;
  border: 1px solid var(--dash-border); box-shadow: var(--dash-soft-shadow);
`;
const BudgetPanel = styled(Panel)`display:flex; flex-direction:column; align-items:center;`;
const CategoryPanel = styled(Panel)`@media(min-width:1024px){ grid-column: span 2; }`;
const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem; width: 100%;
  h3 { font-size: 1rem; font-weight: 600; color: var(--dash-heading); }
`;
const TextLink = styled.button`
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.82rem; color: #ffffff; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
  border: none; cursor: pointer; padding: 0.7rem 0.95rem; border-radius: 999px;
  background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%);
  box-shadow: 0 14px 28px rgba(37,99,235,0.24);
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.03); filter: brightness(1.06); }
`;

// ==========================================
// DONUT
// ==========================================
const DonutWrap = styled.div`
  position: relative; width: 150px; height: 150px;
  display: flex; align-items: center; justify-content: center;
  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .bg { fill:none; stroke:var(--dash-border); stroke-width:3; }
  .fg { fill:none; stroke-width:3; stroke-linecap:round; transition: stroke-dasharray 1s ease, stroke 0.4s; }
`;
const DonutLabel = styled.div`
  position:absolute; display:flex; flex-direction:column; align-items:center;
  span:first-child { font-size:1.75rem; font-weight:700; color:var(--dash-heading); line-height:1; }
  span:last-child  { font-size:0.7rem; color:var(--dash-muted); margin-top:2px; }
`;
const BudgetMeta = styled.div`
  margin-top:1.25rem; text-align:center; width:100%;
  p { font-size:0.8rem; color:var(--dash-muted); margin-bottom:0.25rem; }
  strong { font-size:1.125rem; font-weight:700; color:var(--dash-heading); display:block; }
`;
const AlertBox = styled.div`
  margin-top:0.875rem; padding:0.5rem 0.75rem;
  background:var(--dash-danger-soft); border:1px solid var(--dash-danger-border); border-radius:0.5rem;
  font-size:0.75rem; color:#dc2626; display:flex; align-items:center; gap:0.4rem;
`;

// ==========================================
// CATEGORIAS
// ==========================================
const CatList = styled.div`display:flex; flex-direction:column; gap:1rem;`;
const CatRow = styled.div`display:flex; align-items:flex-start; gap:0.875rem;`;
const CatIcon = styled.div`
  width:2.25rem; height:2.25rem; border-radius:50%; background:var(--dash-surface-muted);
  display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.08); filter: brightness(1.08); box-shadow: 0 12px 24px rgba(37,99,235,0.18); }
`;
const CatName = styled.p`font-size:0.875rem; font-weight:600; color:var(--dash-heading); margin-bottom:0.35rem;`;
const BarWrap = styled.div`width:100%;`;
const BarInfo = styled.div`
  display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;
  span:first-child { color:var(--dash-text); }
  span:last-child  { font-weight:600; color:${p => p.$over ? '#dc2626' : 'var(--dash-muted)'}; }
`;
const BarTrack = styled.div`height:0.375rem; background:var(--dash-border); border-radius:99px; overflow:hidden;`;
const BarFill = styled.div`
  height:100%; border-radius:99px; transition:width 0.6s ease;
  width:${p => p.$w}%; background:${p => p.$c};
`;

// ==========================================
// TABELA
// ==========================================
const TxPanel = styled(Panel)`overflow:hidden; padding:0;`;
const TxHeader = styled(PanelHeader)`padding:1.25rem 1.5rem; border-bottom:1px solid var(--dash-border); margin-bottom:0;`;
const Table = styled.table`
  width:100%; text-align:left; border-collapse:collapse;
  thead {
    background:var(--dash-table-head);
    th { padding:0.75rem 1rem; font-size:0.7rem; font-weight:600; color:var(--dash-muted); text-transform:uppercase; letter-spacing:0.05em; }
  }
  tbody {
    tr { border-bottom:1px solid var(--dash-border); transition:background 0.1s;
      &:last-child { border:none; }
      &:hover { background:var(--dash-surface-muted); }
    }
    td { padding:0.875rem 1rem; font-size:0.875rem; color:var(--dash-heading); }
  }
`;
const TdMuted = styled.td`color:var(--dash-muted) !important; font-size:0.8rem !important;`;
const DelBtn = styled.button`
  padding:0.35rem; border:none; background:none; cursor:pointer;
  border-radius:0.375rem; color:var(--dash-muted); transition:all 0.15s;
  &:hover { color:#ef4444; background:var(--dash-danger-soft); }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const EmptyRow = styled.td`text-align:center; padding:3rem 1rem !important; color:var(--dash-muted); font-size:0.875rem;`;
const EmptyBtn = styled.button`
  margin-top:0.75rem; color:var(--dash-primary); background:none; border:none;
  cursor:pointer; font-weight:500; font-size:0.875rem; display:block; margin-inline:auto;
  &:hover { text-decoration:underline; }
`;

// ==========================================
// UTILITÁRIOS
// ==========================================
const parseDate = (raw) => {
  if (!raw) return null;
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

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const normalizeAmountMap = (raw) => {
  if (!raw) return {};
  const entries = raw instanceof Map
    ? Array.from(raw.entries())
    : Array.isArray(raw)
      ? raw
      : Object.entries(raw);

  return entries.reduce((acc, [key, value]) => {
    if (!key) return acc;
    const numericValue = Number(value);
    acc[key] = Number.isFinite(numericValue) ? numericValue : 0;
    return acc;
  }, {});
};

const toGoalDrafts = (raw) => Object.fromEntries(
  Object.entries(normalizeAmountMap(raw)).map(([key, value]) => [key, String(value)])
);

const sanitizeGoalDrafts = (raw) => Object.entries(raw || {}).reduce((acc, [key, value]) => {
  const numericValue = Number(value);
  if (key && Number.isFinite(numericValue) && numericValue > 0) {
    acc[key] = numericValue;
  }
  return acc;
}, {});

const competenciaHoje = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

// ==========================================
// COMPONENTES PUROS
// ==========================================
const DonutChart = ({ spent, budget }) => {
  const has = budget > 0;
  const pct = has ? Math.min((spent / budget) * 100, 100) : 0;
  const col = !has ? '#cbd5e1' : pct >= 100 ? '#dc2626' : pct > 75 ? '#eab308' : '#16a34a';
  return (
    <DonutWrap>
      <svg viewBox="0 0 36 36">
        <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path className="fg" stroke={col} strokeDasharray={`${pct}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
      </svg>
      <DonutLabel>
        <span>{pct.toFixed(0)}%</span>
        <span>{has ? 'Consumido' : 'Sem meta'}</span>
      </DonutLabel>
    </DonutWrap>
  );
};

const ProgressBar = ({ spent, limit }) => {
  const has = limit > 0;
  const pct = has ? (spent / limit) * 100 : 0;
  const over = pct > 100;
  const col = !has ? '#cbd5e1' : over ? '#dc2626' : pct > 75 ? '#eab308' : '#4f46e5';
  return (
    <BarWrap>
      <BarInfo $over={over}>
        <span>
          R$ {fmt(spent)}
          {has && <span style={{ color: 'var(--dash-muted)' }}> / R$ {fmt(limit)}</span>}
        </span>
        <span>{has ? `${Math.min(pct, 999).toFixed(0)}%` : 'Sem meta'}</span>
      </BarInfo>
      <BarTrack><BarFill $w={has ? Math.min(pct, 100) : 100} $c={col} /></BarTrack>
    </BarWrap>
  );
};

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

// ==========================================
// CONSTANTES
// ==========================================
const CAT_ICONS = {
  "Alimentação": "🍔", "Moradia": "🏠", "Transporte": "🚗",
  "Lazer": "🎉", "Saúde": "💊", "Salário": "💰", "Outros": "📦"
};
const CATS = Object.keys(CAT_ICONS);

// ==========================================
// DASHBOARD
// ==========================================
export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Dados do servidor ---
  const [resumo, setResumo] = useState({ saldo_atual: 0, total_receitas: 0, total_despesas: 0 });
  const [transactions, setTransactions] = useState([]);  // estado próprio para remoção otimista
  const [gastos, setGastos] = useState({});
  const [competencia, setCompetencia] = useState(competenciaHoje());

  // --- limites em estado SEPARADO e INDEPENDENTE ---
  // Regra: só é sobrescrito pelo backend na primeira carga (limitesLoaded=false).
  // Depois disso, apenas ações do usuário alteram esse estado.
  const [limites, setLimites] = useState({});
  const [limitesLoaded, setLimitesLoaded] = useState(false);

  // --- modais ---
  const [txModal, setTxModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, id: null });

  // --- formulários ---
  const [txForm, setTxForm] = useState({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
  const [goalDrafts, setGoalDrafts] = useState({});
  const [newGoal, setNewGoal] = useState({ categoria: 'Alimentação', valor: '' });

  // --- toast ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const notify = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  // ==========================================
  // FETCH — não sobrescreve limites depois da 1ª carga
  // ==========================================
  const fetchDashboard = useCallback(async (forceLimits = false) => {
    try {
      const { data } = await api.get('/wallet/dashboard');
      const gastosNormalizados = normalizeAmountMap(data.gastosPorCategoria);
      const limitesNormalizados = normalizeAmountMap(data.limites);

      setResumo(data.resumo || { saldo_atual: 0, total_receitas: 0, total_despesas: 0 });
      setTransactions((data.recentTransactions || []).filter(tx => !tx.deletadoEm));
      setGastos(gastosNormalizados);
      if (data.competencia) setCompetencia(data.competencia);

      // Só carrega limites do backend na 1ª vez OU quando forceLimits=true
      if (!limitesLoaded || forceLimits) {
        setLimites(limitesNormalizados);
        setLimitesLoaded(true);
      }
    } catch (err) {
      console.error("Erro dashboard:", err);
      notify("Não foi possível carregar os dados", "error");
    } finally {
      setLoading(false);
    }
  }, [limitesLoaded, notify]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (goalModal) {
      setGoalDrafts(toGoalDrafts(limites));
    }
  }, [goalModal, limites]);

  // ==========================================
  // SALVAR TRANSAÇÃO
  // ==========================================
  const handleSaveTransaction = async () => {
    const desc = txForm.descricao.trim();
    if (!desc) return notify("Informe uma descrição", "error");
    if (!txForm.valor) return notify("Informe o valor", "error");
    if (Number(txForm.valor) <= 0) return notify("O valor deve ser maior que zero", "error");

    setSaving(true);
    try {
      const comp = competencia || competenciaHoje();
      await api.post('/wallet/iniciar', { competencia: comp }).catch(() => { });
      await api.post('/wallet/transacao', {
        ...txForm, descricao: desc, valor: Number(txForm.valor), competencia: comp
      });
      setTxModal(false);
      setTxForm({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
      await fetchDashboard(false); // não toca nos limites
      notify("Transação registrada!");
    } catch (err) {
      console.error("Erro transação:", err);
      notify("Erro ao salvar transação", "error");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EXCLUIR TRANSAÇÃO — REMOÇÃO OTIMISTA
  // Remove da tela imediatamente, sincroniza com backend depois
  // ==========================================
  const requestDelete = (id) => setDelConfirm({ open: true, id });

  const confirmDelete = async () => {
    const id = delConfirm.id;
    const txToDelete = transactions.find(tx => tx._id === id);

    // 1. Remove da tela IMEDIATAMENTE
    setTransactions(prev => prev.filter(tx => tx._id !== id));
    if (txToDelete) {
      setResumo(prev => ({
        ...prev,
        total_receitas: txToDelete.tipo === 'receita'
          ? Math.max(0, Number(prev.total_receitas || 0) - Number(txToDelete.valor || 0))
          : Number(prev.total_receitas || 0),
        total_despesas: txToDelete.tipo === 'despesa'
          ? Math.max(0, Number(prev.total_despesas || 0) - Number(txToDelete.valor || 0))
          : Number(prev.total_despesas || 0),
        saldo_atual: Number(prev.saldo_atual || 0)
          + (txToDelete.tipo === 'despesa' ? Number(txToDelete.valor || 0) : -Number(txToDelete.valor || 0))
      }));

      if (txToDelete.tipo === 'despesa') {
        setGastos(prev => {
          const updated = { ...prev };
          const current = Math.max(0, Number(updated[txToDelete.categoria] || 0) - Number(txToDelete.valor || 0));

          if (current === 0) delete updated[txToDelete.categoria];
          else updated[txToDelete.categoria] = current;

          return updated;
        });
      }
    }
    setDelConfirm({ open: false, id: null });
    notify("Transação removida!");

    // 2. Persiste no backend (sem bloquear a UI)
    try {
      const comp = competencia || competenciaHoje();
      await api.delete(`/wallet/${comp}/transacao/${id}`);
      await fetchDashboard(false); // atualiza resumo/saldo sem tocar em limites
    } catch (err) {
      console.error("Erro ao excluir:", err);
      notify("Erro ao excluir — recarregue a página", "error");
      await fetchDashboard(false); // reverte se falhou
    }
  };

  // ==========================================
  // METAS — persiste no estado local E no backend
  // ==========================================
  const persistLimites = async (novoLimites) => {
    const limitesNormalizados = normalizeAmountMap(novoLimites);

    // Atualiza estado local imediatamente (não espera o backend)
    setLimites(limitesNormalizados);
    try {
      const comp = competencia || competenciaHoje();
      await api.put(`/wallet/${comp}/limites`, { limites: limitesNormalizados });
    } catch (err) {
      console.error("Erro limites:", err);
      notify("Erro ao salvar meta no servidor", "error");
    }
  };

  const handleGoalDraftChange = (cat, value) => {
    setGoalDrafts(prev => ({ ...prev, [cat]: value }));
  };

  const handleAddGoal = () => {
    if (!newGoal.valor || Number(newGoal.valor) <= 0)
      return notify("Informe um valor válido", "error");

    setGoalDrafts(prev => ({ ...prev, [newGoal.categoria]: newGoal.valor }));
    setNewGoal({ categoria: 'Alimentação', valor: '' });
  };

  const handleRemoveGoal = (cat) => {
    const updated = { ...goalDrafts };
    delete updated[cat];
    setGoalDrafts(updated);
  };

  const handleSaveAllGoals = async () => {
    let final = sanitizeGoalDrafts(goalDrafts);
    if (newGoal.valor && Number(newGoal.valor) > 0)
      final[newGoal.categoria] = Number(newGoal.valor);
    await persistLimites(final);
    setGoalModal(false);
    setNewGoal({ categoria: 'Alimentação', valor: '' });
    notify("Metas atualizadas!");
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  // Fallback: calcula gastos das transações locais se backend não retornar
  const fallbackGastos = {};
  transactions.forEach(tx => {
    if (tx.tipo === 'despesa')
      fallbackGastos[tx.categoria] = (fallbackGastos[tx.categoria] || 0) + Number(tx.valor || 0);
  });
  const gastosAtuais = Object.keys(gastos).length > 0 ? gastos : fallbackGastos;

  const todasCategorias = Array.from(new Set([
    ...Object.keys(gastosAtuais),
    ...Object.keys(limites)
  ])).filter(c => c !== 'Salário' && c !== 'Receita');

  const totalOrcamento = Object.values(limites).reduce((a, b) => a + Number(b), 0);
  const totalDespesas = resumo.total_despesas || 0;
  const acima = totalOrcamento > 0 && totalDespesas > totalOrcamento;

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) return (
    <AppContainer $dark={isDark} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Wallet size={40} color={isDark ? '#60a5fa' : '#2563eb'} style={{ marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--dash-muted)', fontSize: '0.875rem' }}>Carregando seu dashboard...</p>
      </div>
    </AppContainer>
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <AppContainer $dark={isDark}>

      {/* TOAST */}
      {toast.show && (
        <ToastContainer>
          <Toast $type={toast.type}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </Toast>
        </ToastContainer>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {delConfirm.open && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDelConfirm({ open: false, id: null })}
        />
      )}

      {/* MODAL: NOVA TRANSAÇÃO */}
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
                {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
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

      {/* MODAL: METAS */}
      {goalModal && (
        <ModalOverlay onClick={e => e.target === e.currentTarget && setGoalModal(false)}>
          <ModalContent>
            <ModalHeader>
              <h3>Gerenciar Metas</h3>
              <button onClick={() => setGoalModal(false)}><X size={18} /></button>
            </ModalHeader>

            <div style={{ marginBottom: '1.25rem' }}>
              {Object.keys(goalDrafts).length === 0
                ? <p style={{ fontSize: '0.875rem', color: 'var(--dash-muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                  Nenhuma meta definida ainda.
                </p>
                : Object.entries(goalDrafts).map(([cat, val]) => (
                  <GoalItem key={cat}>
                    <div className="goal-info">
                      <span>{CAT_ICONS[cat] || '📦'} <strong>{cat}</strong></span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={val}
                        onChange={e => handleGoalDraftChange(cat, e.target.value)}
                        aria-label={`Meta da categoria ${cat}`}
                      />
                    </div>
                    <button onClick={() => handleRemoveGoal(cat)} title="Remover"><Trash2 size={14} /></button>
                  </GoalItem>
                ))
              }
            </div>

            <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dash-muted-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Adicionar nova meta
              </p>
              <FormGroup>
                <label>Categoria</label>
                <select value={newGoal.categoria} onChange={e => setNewGoal({ ...newGoal, categoria: e.target.value })}>
                  {CATS.filter(c => c !== 'Salário').map(c =>
                    <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                  )}
                </select>
              </FormGroup>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" min="1" step="0.01" placeholder="R$ Limite mensal"
                  value={newGoal.valor} onChange={e => setNewGoal({ ...newGoal, valor: e.target.value })}
                  style={{
                    flex: 1, padding: '0.7rem 0.875rem', border: '1px solid var(--dash-border)',
                    borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', background: 'var(--dash-input-bg)',
                    color: 'var(--dash-heading)', WebkitTextFillColor: 'var(--dash-heading)'
                  }} />
                <button onClick={handleAddGoal}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '0.5rem',
                    padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <ModalFooter>
              <button className="cancel" onClick={() => setGoalModal(false)}>Fechar</button>
              <button className="save" onClick={handleSaveAllGoals}>Salvar tudo</button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* SIDEBAR */}
      <Sidebar>
        <LogoArea><Wallet size={22} /> Web-Wallet</LogoArea>
        <NavMenu>
          <NavItem $active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
            <Home size={17} /> Dashboard
          </NavItem>
          <NavItem onClick={() => notify('Relatórios em breve!', 'error')}>
            <FileText size={17} /> Relatórios
          </NavItem>
          <NavItem onClick={() => notify('Configurações em breve!', 'error')}>
            <Settings size={17} /> Configurações
          </NavItem>
        </NavMenu>
        <SidebarFooter>
          <ThemeToggleBox onClick={toggleTheme} title="Alternar tema" $dark={isDark}>
            <ThemeToggleMeta>
              {isDark ? <Moon size={18} color="#60a5fa" /> : <SunMedium size={18} color="#2563eb" />}
              <div>
                <strong>Tema fintech</strong>
                <span>{isDark ? 'Escuro azul tecnológico' : 'Claro clean'}</span>
              </div>
            </ThemeToggleMeta>
            <SwitchTrack $on={isDark} $dark={isDark}>
              <SwitchThumb $on={isDark}>
                {isDark ? <Moon size={12} /> : <SunMedium size={12} />}
              </SwitchThumb>
            </SwitchTrack>
          </ThemeToggleBox>
          <LogoutButton onClick={handleLogout} title="Sair">
            <LogOut size={18} />
            Sair
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      {/* MAIN */}
      <MainContent>
        <Header>
          <HeaderTitle>Visão Geral</HeaderTitle>
          <AddButton onClick={() => setTxModal(true)}>
            <Plus size={15} /> Nova Transação
          </AddButton>
        </Header>

        <ContentArea>
          <ContentWrapper>

            {/* KPI */}
            <KpiGrid>
              <KpiCard>
                <KpiHeader>
                  <h3>Receitas</h3>
                  <IconBox $t="in"><ArrowUpCircle size={18} /></IconBox>
                </KpiHeader>
                <KpiVal>R$ {fmt(resumo.total_receitas)}</KpiVal>
              </KpiCard>
              <KpiCard>
                <KpiHeader>
                  <h3>Despesas</h3>
                  <IconBox $t="out"><ArrowDownCircle size={18} /></IconBox>
                </KpiHeader>
                <KpiVal>R$ {fmt(resumo.total_despesas)}</KpiVal>
              </KpiCard>
              <HighlightCard>
                <HiHeader>
                  <h3>Saldo Atual</h3>
                  <IconBox $t="bal"><Wallet size={18} /></IconBox>
                </HiHeader>
                <HiVal>R$ {fmt(resumo.saldo_atual)}</HiVal>
              </HighlightCard>
            </KpiGrid>

            {/* ORÇAMENTO + CATEGORIAS */}
            <MainGrid>
              <BudgetPanel>
                <PanelHeader><h3>Orçamento Mensal</h3></PanelHeader>
                <DonutChart spent={totalDespesas} budget={totalOrcamento} />
                <BudgetMeta>
                  <p>Total de despesas</p>
                  <strong>R$ {fmt(totalDespesas)}</strong>
                  {totalOrcamento > 0 &&
                    <p style={{ marginTop: '0.25rem' }}>de R$ {fmt(totalOrcamento)} em metas</p>}
                </BudgetMeta>
                {acima && (
                  <AlertBox><AlertTriangle size={13} /> Orçamento ultrapassado!</AlertBox>
                )}
              </BudgetPanel>

              <CategoryPanel>
                <PanelHeader>
                  <h3>Gasto por Categoria</h3>
                  <TextLink onClick={() => setGoalModal(true)}>
                    <Sparkles size={14} />
                    Gerenciar Metas
                  </TextLink>
                </PanelHeader>
                <CatList>
                  {todasCategorias.length === 0
                    ? <p style={{ fontSize: '0.875rem', color: 'var(--dash-muted)', textAlign: 'center', padding: '1rem 0' }}>
                      Nenhuma transação ou meta registrada.
                    </p>
                    : todasCategorias.map(cat => (
                      <CatRow key={cat}>
                        <CatIcon>{CAT_ICONS[cat] || '📦'}</CatIcon>
                        <div style={{ flex: 1, paddingTop: '0.2rem' }}>
                          <CatName>{cat}</CatName>
                          <ProgressBar
                            spent={Number(gastosAtuais[cat] || 0)}
                            limit={Number(limites[cat] || 0)}
                          />
                        </div>
                      </CatRow>
                    ))
                  }
                </CatList>
              </CategoryPanel>
            </MainGrid>

            {/* TABELA */}
            <TxPanel>
              <TxHeader><h3>Últimas Transações</h3></TxHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Descrição</th><th>Categoria</th>
                    <th>Data</th><th>Valor</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <EmptyRow colSpan={5}>
                        Nenhuma transação registrada neste mês.
                        <EmptyBtn onClick={() => setTxModal(true)}>
                          + Adicionar primeira transação
                        </EmptyBtn>
                      </EmptyRow>
                    </tr>
                  ) : transactions.map(tx => {
                    const raw = tx.data || tx.createdAt || tx.date;
                    const dt = parseDate(raw);
                    const dStr = dt ? dt.toLocaleDateString('pt-BR') : '—';
                    const isIn = tx.tipo === 'receita';
                    return (
                      <tr key={tx._id}>
                        <td style={{ fontWeight: 500 }}>{tx.descricao}</td>
                        <TdMuted>{CAT_ICONS[tx.categoria] || '📦'} {tx.categoria}</TdMuted>
                        <TdMuted>{dStr}</TdMuted>
                        <td style={{ color: isIn ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {isIn ? '+' : '-'} R$ {fmt(tx.valor)}
                        </td>
                        <td>
                          <DelBtn onClick={() => requestDelete(tx._id)} title="Excluir">
                            <Trash2 size={14} />
                          </DelBtn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TxPanel>

          </ContentWrapper>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}
