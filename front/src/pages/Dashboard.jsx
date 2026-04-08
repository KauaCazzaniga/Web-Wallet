import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import ImportButton from '../components/ImportButton';
import ImportModal from '../components/ImportModal';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { parseBankStatement } from '../utils/geminiParser';
import {
  GASTOS_FIXOS, GASTOS_FIXOS_PREFIX, GASTOS_FIXOS_MAP,
  resolverGastoFixo, labelCategoria, iconeCategoria,
} from '../constants/gastosFixos';
import {
  CATEGORIAS_IMPORTACAO,
  gerarChaveTransacao,
  prepararTransacoesImportadas,
} from '../utils/categorizador';
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
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 0.85rem 1rem; background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  border-radius: 0.75rem; margin-bottom: 0.65rem;
  box-shadow: var(--dash-soft-shadow);
  .goal-info {
    display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; justify-content: space-between; width: 100%;
  }
  span { font-size: 0.95rem; white-space: nowrap; color: var(--dash-heading); }
  input {
    width: 7rem; padding: 0.6rem 0.8rem; border: 1px solid var(--dash-border-strong);
    border-radius: 0.625rem; font-size: 0.875rem; outline: none; background: var(--dash-input-bg);
    color: var(--dash-heading); -webkit-text-fill-color: var(--dash-heading); flex-shrink: 0;
    &:focus { border-color: var(--dash-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  }
  button { color: #ef4444; border: none; background: none; cursor: pointer; padding: 0.35rem; border-radius: 0.375rem; flex-shrink: 0; &:hover { background: #fef2f2; } }
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
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
`;
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
const InvestmentPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;
const InvestmentHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--dash-heading);

  strong {
    display: block;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  span {
    display: block;
    color: var(--dash-muted);
    font-size: 0.82rem;
    margin-top: 0.15rem;
  }
`;
const InvestmentIcon = styled.div`
  width: 2.8rem;
  height: 2.8rem;
  display: grid;
  place-items: center;
  border-radius: 0.9rem;
  font-size: 1.35rem;
  background: rgba(127, 119, 221, 0.14);
  color: #7F77DD;
  box-shadow: inset 0 0 0 1px rgba(127, 119, 221, 0.2);
`;
const InvestmentStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const InvestmentStat = styled.div`
  padding: 1rem 1.1rem;
  border-radius: 0.9rem;
  background: var(--dash-surface-muted);
  border: 1px solid var(--dash-border);

  span {
    display: block;
    font-size: 0.76rem;
    color: var(--dash-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.45rem;
  }

  strong {
    display: block;
    font-size: 1.35rem;
    color: var(--dash-heading);
    letter-spacing: -0.04em;
  }
`;
const InvestmentAction = styled.button`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.78rem 1rem;
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  background: linear-gradient(135deg, #7F77DD 0%, #5b67ff 100%);
  box-shadow: 0 14px 28px rgba(127,119,221,0.26);
  transition: transform .22s ease, filter .22s ease;

  &:hover {
    transform: translateY(-3px);
    filter: brightness(1.05);
  }
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
// GASTOS FIXOS — ACORDEÃO
// ==========================================
const GFPaiRow = styled.div`
  display:flex; align-items:center; gap:0.875rem; cursor:pointer;
  padding:0.5rem 0.35rem; border-radius:0.625rem; transition:background 0.15s;
  &:hover { background:var(--dash-surface-muted); }
`;
const GFChevron = styled.span`
  display:inline-flex; align-items:center; justify-content:center;
  font-size:0.7rem; color:var(--dash-muted); transition:transform 0.3s ease;
  transform:rotate(${p => p.$open ? '90deg' : '0deg'});
  flex-shrink:0; width:1rem;
`;
const GFFilhosWrap = styled.div`
  overflow:hidden; transition:max-height 0.3s ease;
  max-height:${p => p.$open ? '1200px' : '0px'};
`;
const GFFilhoRow = styled.div`
  display:flex; align-items:flex-start; gap:0.75rem;
  margin-left:24px; padding:0.45rem 0; position:relative;
  &::before {
    content:''; position:absolute; left:-12px; top:0; bottom:0;
    width:1px; background:var(--dash-muted); opacity:0.3;
  }
`;
const GFFilhoIcon = styled.div`
  width:1.85rem; height:1.85rem; border-radius:50%; background:var(--dash-surface-muted);
  display:flex; align-items:center; justify-content:center; font-size:0.95rem; flex-shrink:0;
`;
const GFFilhoName = styled.p`font-size:0.8125rem; font-weight:600; color:var(--dash-heading); margin-bottom:0.3rem;`;
const GFBarTrack = styled.div`height:4px; background:var(--dash-border); border-radius:99px; overflow:hidden;`;
const GFBarFill = styled.div`
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
    const [y, m, d] = String(raw).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
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
const fmtCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

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

const getTransactionRawDate = (transaction) =>
  transaction?.data ||
  transaction?.data_hora ||
  transaction?.createdAt ||
  transaction?.date ||
  transaction?.importedAt ||
  null;

const getTransactionCompetencia = (transaction) => {
  if (transaction?.competencia) return transaction.competencia;

  const rawDate = String(getTransactionRawDate(transaction) || '');
  return rawDate.length >= 7 ? rawDate.slice(0, 7) : null;
};

const sortTransactionsByDateDesc = (left, right) => {
  const leftValue = parseDate(getTransactionRawDate(left))?.getTime() || 0;
  const rightValue = parseDate(getTransactionRawDate(right))?.getTime() || 0;
  return rightValue - leftValue;
};

const EMPTY_IMPORT_STATE = {
  banco: null,
  periodo: { inicio: null, fim: null },
  transacoes: [],
  total_transacoes: 0,
  observacoes: null,
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

/** Cor progressiva para barras de Gastos Fixos */
const getBarColorGF = (pct) => {
  if (pct >= 100) return '#E24B4A';
  if (pct >= 86)  return '#D85A30';
  if (pct >= 61)  return '#EF9F27';
  return '#378ADD';
};

const ProgressBar = ({ spent, limit, category }) => {
  const has = limit > 0;
  const pct = has ? (spent / limit) * 100 : 0;
  const over = pct > 100;
  const baseCol = category === 'Investimentos' ? '#7F77DD' : '#4f46e5';
  const col = !has ? '#cbd5e1' : over ? '#dc2626' : pct > 75 ? '#eab308' : baseCol;
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
  "Alimentação": "🍔", "Transporte": "🚗",
  "Lazer": "🎉", "Saúde": "💊", "Salário": "💰", "Investimentos": "📈", "Outros": "📦"
};
const CATS = Object.keys(CAT_ICONS);

/** Resolve label e ícone para qualquer categoria (normal ou gastos_fixos.*) */
const resolveCatDisplay = (cat) => {
  const fixo = resolverGastoFixo(cat);
  if (fixo) return { label: fixo.label, icon: fixo.icon };
  return { label: cat, icon: CAT_ICONS[cat] || '📦' };
};

// ==========================================
// DASHBOARD
// ==========================================
function DashboardContent() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const {
    importedTransactions,
    investimentos,
    highlightedIds,
    importTransactionsBatch,
    removeImportedTransaction,
    adicionarAporte,
  } = useFinance();
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
  const [importModal, setImportModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, id: null });
  const [importingExtract, setImportingExtract] = useState(false);
  const [importingSave, setImportingSave] = useState(false);
  const [importData, setImportData] = useState(EMPTY_IMPORT_STATE);

  // --- formulários ---
  const [txForm, setTxForm] = useState({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
  const [goalDrafts, setGoalDrafts] = useState({});
  const [newGoal, setNewGoal] = useState({ categoria: 'Alimentação', valor: '' });
  const [gfDrafts, setGfDrafts] = useState({});
  const [investmentModal, setInvestmentModal] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    mes: competenciaHoje(),
    valor: '',
    descricao: '',
  });

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
      // Separar limites normais e gastos fixos
      const normais = {};
      const fixos = {};
      Object.entries(normalizeAmountMap(limites)).forEach(([k, v]) => {
        if (k.startsWith(GASTOS_FIXOS_PREFIX)) {
          const subKey = k.slice(GASTOS_FIXOS_PREFIX.length);
          fixos[subKey] = String(v);
        } else {
          normais[k] = String(v);
        }
      });
      setGoalDrafts(normais);
      // Preencher todas as subcategorias (com 0 como default)
      const gfInit = {};
      GASTOS_FIXOS.forEach(({ key }) => { gfInit[key] = String(fixos[key] || '0'); });
      setGfDrafts(gfInit);
    }
  }, [goalModal, limites]);

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

  const closeImportModal = () => {
    setImportModal(false);
    setImportData(EMPTY_IMPORT_STATE);
  };

  const handleImportFile = async (file) => {
    setImportingExtract(true);

    try {
      const textoExtraido = await extractTextFromPdf(file);
      const parsed = await parseBankStatement(textoExtraido);
      const transacoesPreparadas = prepararTransacoesImportadas(parsed.transacoes);

      if (!transacoesPreparadas.length) {
        throw new Error('Nenhuma transação identificada neste extrato');
      }

      const competenciasExtrato = transacoesPreparadas
        .map((transaction) => transaction.data?.slice(0, 7))
        .filter(Boolean);

      const transacoesServidor = await fetchTransactionsByCompetencia(competenciasExtrato);
      const transacoesImportadas = importedTransactions.filter((transaction) =>
        competenciasExtrato.includes(getTransactionCompetencia(transaction)),
      );

      const chavesExistentes = new Set(
        [...transacoesServidor, ...transacoesImportadas].map((transaction) =>
          gerarChaveTransacao({
            data: String(getTransactionRawDate(transaction) || '').slice(0, 10),
            valor: transaction.valor,
            descricao: transaction.descricao,
          }),
        ),
      );

      const chavesNoArquivo = new Set();
      const transacoesComDeduplicacao = transacoesPreparadas.map((transaction) => {
        const chave = gerarChaveTransacao(transaction);
        const duplicada = chavesExistentes.has(chave) || chavesNoArquivo.has(chave);
        chavesNoArquivo.add(chave);

        return {
          ...transaction,
          duplicada,
          avisoDuplicata: duplicada ? 'Possível duplicata' : null,
        };
      });

      setImportData({
        ...parsed,
        total_transacoes: transacoesComDeduplicacao.length,
        transacoes: transacoesComDeduplicacao,
      });
      setImportModal(true);
    } catch (error) {
      notify(error?.message || 'Erro ao importar extrato', 'error');
    } finally {
      setImportingExtract(false);
    }
  };

  const handleImportCategoryChange = (idLocal, categoria) => {
    setImportData((current) => ({
      ...current,
      transacoes: current.transacoes.map((transaction) =>
        transaction.idLocal === idLocal ? { ...transaction, categoria } : transaction,
      ),
    }));
  };

  const handleToggleImportedSelection = (idLocal) => {
    setImportData((current) => ({
      ...current,
      transacoes: current.transacoes.map((transaction) =>
        transaction.idLocal === idLocal
          ? { ...transaction, incluir: !transaction.incluir }
          : transaction,
      ),
    }));
  };

  const handleConfirmImport = async () => {
    const selecionadas = importData.transacoes.filter((transaction) => transaction.incluir);

    if (!selecionadas.length) {
      notify('Selecione ao menos uma transação para importar', 'error');
      return;
    }

    setImportingSave(true);

    try {
      const adicionadas = await importTransactionsBatch(
        selecionadas.map((transaction) => ({
          ...transaction,
          competencia: transaction.data?.slice(0, 7) || competencia || competenciaHoje(),
        })),
      );

      closeImportModal();
      notify(`${adicionadas.length} transações importadas com sucesso`);
    } catch (error) {
      notify('Não foi possível salvar as transações importadas', 'error');
    } finally {
      setImportingSave(false);
    }
  };

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
  const requestDelete = (transaction) => {
    if (transaction?.isImported) {
      removeImportedTransaction(transaction._id);
      notify('Transação importada removida!');
      return;
    }

    setDelConfirm({ open: true, id: transaction?._id });
  };

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
    // Mesclar metas de gastos fixos com prefixo
    Object.entries(gfDrafts).forEach(([key, val]) => {
      const num = Number(val);
      if (Number.isFinite(num) && num > 0) {
        final[GASTOS_FIXOS_PREFIX + key] = num;
      }
    });
    await persistLimites(final);
    setGoalModal(false);
    setNewGoal({ categoria: 'Alimentação', valor: '' });
    notify("Metas atualizadas!");
  };

  const resetInvestmentForm = () => {
    setInvestmentForm({
      mes: competenciaHoje(),
      valor: '',
      descricao: '',
    });
  };

  const openInvestmentModal = () => {
    resetInvestmentForm();
    setInvestmentModal(true);
  };

  const handleSaveInvestment = async () => {
    if (!investmentForm.valor || Number(investmentForm.valor) <= 0) {
      notify('Informe um valor válido para o aporte', 'error');
      return;
    }

    setSavingInvestment(true);
    try {
      adicionarAporte(investmentForm.mes, Number(investmentForm.valor), investmentForm.descricao);
      setInvestmentModal(false);
      resetInvestmentForm();
      notify('Aporte registrado com sucesso!');
    } catch (error) {
      notify(error?.message || 'Não foi possível registrar o aporte', 'error');
    } finally {
      setSavingInvestment(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const mesAtualInvestimentos = competenciaHoje();

  const importedCurrentTransactions = useMemo(
    () => [...importedTransactions].sort(sortTransactionsByDateDesc),
    [importedTransactions],
  );

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  // Fallback: calcula gastos das transações locais se backend não retornar
  const fallbackGastos = {};
  transactions.forEach(tx => {
    if (tx.tipo === 'despesa')
      fallbackGastos[tx.categoria] = (fallbackGastos[tx.categoria] || 0) + Number(tx.valor || 0);
  });
  const gastosAtuais = useMemo(() => {
    const base = { ...(Object.keys(gastos).length > 0 ? gastos : fallbackGastos) };

    importedCurrentTransactions.forEach((transaction) => {
      if (transaction.tipo === 'despesa') {
        base[transaction.categoria] = (base[transaction.categoria] || 0) + Number(transaction.valor || 0);
      }
    });

    return base;
  }, [fallbackGastos, gastos, importedCurrentTransactions]);

  const resumoImportado = useMemo(() => importedCurrentTransactions.reduce((acc, transaction) => {
    const valor = Number(transaction.valor || 0);

    if (transaction.tipo === 'receita') acc.total_receitas += valor;
    else acc.total_despesas += valor;

    return acc;
  }, { total_receitas: 0, total_despesas: 0 }), [importedCurrentTransactions]);

  const resumoAtual = useMemo(() => ({
    saldo_atual: Number(resumo.saldo_atual || 0) + resumoImportado.total_receitas - resumoImportado.total_despesas,
    total_receitas: Number(resumo.total_receitas || 0) + resumoImportado.total_receitas,
    total_despesas: Number(resumo.total_despesas || 0) + resumoImportado.total_despesas,
  }), [resumo, resumoImportado]);

  const tabelaTransacoes = useMemo(
    () => [...importedCurrentTransactions, ...transactions].sort(sortTransactionsByDateDesc),
    [importedCurrentTransactions, transactions],
  );

  const todasCategorias = Array.from(new Set([
    ...Object.keys(gastosAtuais),
    ...Object.keys(limites)
  ])).filter(c => c !== 'Salário' && c !== 'Receita' && !String(c).startsWith(GASTOS_FIXOS_PREFIX));

  // ==== GASTOS FIXOS — dados derivados ====
  const gfGastos = useMemo(() => {
    const result = {};
    GASTOS_FIXOS.forEach(({ key }) => {
      const catKey = GASTOS_FIXOS_PREFIX + key;
      result[key] = Number(gastosAtuais[catKey] || 0);
    });
    return result;
  }, [gastosAtuais]);

  const gfMetas = useMemo(() => {
    const result = {};
    GASTOS_FIXOS.forEach(({ key }) => {
      result[key] = Number(limites[GASTOS_FIXOS_PREFIX + key] || 0);
    });
    return result;
  }, [limites]);

  const gfTotalGasto = useMemo(() => Object.values(gfGastos).reduce((a, b) => a + b, 0), [gfGastos]);
  const gfTotalMeta = useMemo(() => {
    // Só soma metas > 0 (filhas sem meta não entram)
    return GASTOS_FIXOS.reduce((acc, { key }) => {
      const meta = gfMetas[key];
      return meta > 0 ? acc + meta : acc;
    }, 0);
  }, [gfMetas]);
  const gfTotalPct = gfTotalMeta > 0 ? (gfTotalGasto / gfTotalMeta) * 100 : -1; // -1 = sem meta

  // Acordeão: estado + auto-abertura se alerta
  const [gastosFixosAberto, setGastosFixosAberto] = useState(() => {
    try {
      const saved = localStorage.getItem('webwallet_gastosfixos_aberto');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });

  // Auto-abrir se alguma filha >= 85%
  useEffect(() => {
    const alerta = GASTOS_FIXOS.some(({ key }) => {
      const meta = gfMetas[key];
      if (meta <= 0) return false;
      return (gfGastos[key] / meta) * 100 >= 85;
    });
    if (alerta) {
      setGastosFixosAberto(true);
      try { localStorage.setItem('webwallet_gastosfixos_aberto', 'true'); } catch {}
    }
  }, [gfGastos, gfMetas]);

  const toggleGastosFixos = useCallback(() => {
    setGastosFixosAberto(prev => {
      const next = !prev;
      try { localStorage.setItem('webwallet_gastosfixos_aberto', String(next)); } catch {}
      return next;
    });
  }, []);

  const totalOrcamento = Object.values(limites).reduce((a, b) => a + Number(b), 0);
  const totalDespesas = resumoAtual.total_despesas || 0;
  const acima = totalOrcamento > 0 && totalDespesas > totalOrcamento;
  const totalInvestido = useMemo(
    () => investimentos.reduce((acc, investimento) => acc + Number(investimento.valor || 0), 0),
    [investimentos],
  );
  const aporteMesAtual = useMemo(
    () => investimentos
      .filter((investimento) => investimento.mes === mesAtualInvestimentos)
      .reduce((acc, investimento) => acc + Number(investimento.valor || 0), 0),
    [investimentos, mesAtualInvestimentos],
  );

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
                <optgroup label="── Gastos Fixos ──">
                  {GASTOS_FIXOS.map(({ key, label, icon }) => (
                    <option key={key} value={GASTOS_FIXOS_PREFIX + key}>{icon} {label}</option>
                  ))}
                </optgroup>
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

            {/* Seção Gastos Fixos */}
            <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dash-muted-strong)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                🔗 Gastos Fixos
              </p>
              {GASTOS_FIXOS.map(({ key, label, icon }) => (
                <GoalItem key={key}>
                  <div className="goal-info">
                    <span>{icon} <strong>{label}</strong></span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={gfDrafts[key] || '0'}
                      onChange={e => setGfDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                      aria-label={`Meta de ${label}`}
                    />
                  </div>
                </GoalItem>
              ))}
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

      {investmentModal && (
        <ModalOverlay onClick={e => {
          if (e.target === e.currentTarget) {
            setInvestmentModal(false);
            resetInvestmentForm();
          }
        }}>
          <ModalContent $sm>
            <ModalHeader>
              <h3>Registrar aporte</h3>
              <button onClick={() => {
                setInvestmentModal(false);
                resetInvestmentForm();
              }}><X size={18} /></button>
            </ModalHeader>
            <FormGroup>
              <label>Mês/Ano</label>
              <input
                type="month"
                value={investmentForm.mes}
                onChange={e => setInvestmentForm({ ...investmentForm, mes: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Valor</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={investmentForm.valor}
                onChange={e => setInvestmentForm({ ...investmentForm, valor: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <label>Descrição</label>
              <input
                type="text"
                placeholder="Ex: CDB, Ações"
                value={investmentForm.descricao}
                onChange={e => setInvestmentForm({ ...investmentForm, descricao: e.target.value })}
              />
            </FormGroup>
            <ModalFooter>
              <button className="cancel" onClick={() => {
                setInvestmentModal(false);
                resetInvestmentForm();
              }} disabled={savingInvestment}>Cancelar</button>
              <button className="save" onClick={handleSaveInvestment} disabled={savingInvestment}>
                {savingInvestment ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      <ImportModal
        open={importModal}
        parsedData={importData}
        categories={CATEGORIAS_IMPORTACAO}
        saving={importingSave}
        onClose={closeImportModal}
        onConfirm={handleConfirmImport}
        onChangeCategory={handleImportCategoryChange}
        onToggleInclude={handleToggleImportedSelection}
      />

      {/* SIDEBAR */}
      <Sidebar>
        <LogoArea><Wallet size={22} /> Web-Wallet</LogoArea>
        <NavMenu>
          <NavItem $active={activeTab === 'dashboard'} onClick={() => {
            setActiveTab('dashboard');
            navigate('/dashboard');
          }}>
            <Home size={17} /> Dashboard
          </NavItem>
          <NavItem onClick={() => navigate('/relatorios')}>
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
            <LogOut size={18} />
            Sair
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      {/* MAIN */}
      <MainContent>
        <Header>
          <HeaderTitle>Visão Geral</HeaderTitle>
          <HeaderActions>
            <ImportButton
              loading={importingExtract}
              onSelectFile={handleImportFile}
              onError={(message) => notify(message, 'error')}
            />
            <AddButton onClick={() => setTxModal(true)}>
              <Plus size={15} /> Nova Transação
            </AddButton>
          </HeaderActions>
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
                <KpiVal>R$ {fmt(resumoAtual.total_receitas)}</KpiVal>
              </KpiCard>
              <KpiCard>
                <KpiHeader>
                  <h3>Despesas</h3>
                  <IconBox $t="out"><ArrowDownCircle size={18} /></IconBox>
                </KpiHeader>
                <KpiVal>R$ {fmt(resumoAtual.total_despesas)}</KpiVal>
              </KpiCard>
              <HighlightCard>
                <HiHeader>
                  <h3>Saldo Atual</h3>
                  <IconBox $t="bal"><Wallet size={18} /></IconBox>
                </HiHeader>
                <HiVal>R$ {fmt(resumoAtual.saldo_atual)}</HiVal>
              </HighlightCard>
            </KpiGrid>

            <InvestmentPanel>
              <InvestmentHead>
                <InvestmentIcon>📈</InvestmentIcon>
                <div>
                  <strong>Investimentos</strong>
                  <span>Aportes acumulados para acompanhar sua evolução patrimonial.</span>
                </div>
              </InvestmentHead>

              <InvestmentStats>
                <InvestmentStat>
                  <span>Total acumulado</span>
                  <strong>{fmtCurrency(totalInvestido)}</strong>
                </InvestmentStat>
                <InvestmentStat>
                  <span>Aporte este mês</span>
                  <strong>{fmtCurrency(aporteMesAtual)}</strong>
                </InvestmentStat>
              </InvestmentStats>

              <InvestmentAction onClick={openInvestmentModal}>
                <Plus size={16} />
                Registrar aporte
              </InvestmentAction>
            </InvestmentPanel>

            {/* TODO: gráfico cumulativo e tabela de aportes → src/pages/Relatorios.jsx */}

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
                  {/* GASTOS FIXOS — grupo expansível */}
                  <div>
                    <GFPaiRow onClick={toggleGastosFixos}>
                      <CatIcon>🔗</CatIcon>
                      <div style={{ flex: 1, paddingTop: '0.2rem' }}>
                        <CatName>Gastos Fixos</CatName>
                        <BarWrap>
                          <BarInfo $over={gfTotalPct > 100}>
                            <span>
                              R$ {fmt(gfTotalGasto)}
                              {gfTotalMeta > 0 && <span style={{ color: 'var(--dash-muted)' }}> / R$ {fmt(gfTotalMeta)}</span>}
                            </span>
                            <span>{gfTotalPct < 0 ? '—' : `${Math.min(gfTotalPct, 999).toFixed(0)}%`}</span>
                          </BarInfo>
                          <BarTrack>
                            <BarFill
                              $w={gfTotalPct < 0 ? 100 : Math.min(gfTotalPct, 100)}
                              $c={gfTotalPct < 0 ? '#cbd5e1' : getBarColorGF(gfTotalPct)}
                            />
                          </BarTrack>
                        </BarWrap>
                      </div>
                      <GFChevron $open={gastosFixosAberto}>▶</GFChevron>
                    </GFPaiRow>

                    <GFFilhosWrap $open={gastosFixosAberto}>
                      {GASTOS_FIXOS.map(({ key, label, icon }) => {
                        const gasto = gfGastos[key];
                        const meta = gfMetas[key];
                        const hasMeta = meta > 0;
                        const pct = hasMeta ? (gasto / meta) * 100 : 0;
                        return (
                          <GFFilhoRow key={key}>
                            <GFFilhoIcon>{icon}</GFFilhoIcon>
                            <div style={{ flex: 1, paddingTop: '0.15rem' }}>
                              <GFFilhoName>{label}</GFFilhoName>
                              <BarWrap>
                                <BarInfo $over={pct > 100} style={{ fontSize: '0.7rem' }}>
                                  <span style={{ fontSize: '0.7rem' }}>
                                    R$ {fmt(gasto)}
                                    {hasMeta && <span style={{ color: 'var(--dash-muted)' }}> / R$ {fmt(meta)}</span>}
                                  </span>
                                  <span style={{ fontSize: '0.7rem' }}>{hasMeta ? `${Math.min(pct, 999).toFixed(0)}%` : 'Sem meta'}</span>
                                </BarInfo>
                                <GFBarTrack>
                                  <GFBarFill
                                    $w={hasMeta ? Math.min(pct, 100) : 100}
                                    $c={!hasMeta ? '#cbd5e1' : getBarColorGF(pct)}
                                  />
                                </GFBarTrack>
                              </BarWrap>
                            </div>
                          </GFFilhoRow>
                        );
                      })}
                    </GFFilhosWrap>
                  </div>

                  {/* Categorias normais */}
                  {todasCategorias.length === 0 && gfTotalGasto === 0
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
                            category={cat}
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
                  {tabelaTransacoes.length === 0 ? (
                    <tr>
                      <EmptyRow colSpan={5}>
                        Nenhuma transação registrada neste mês.
                        <EmptyBtn onClick={() => setTxModal(true)}>
                          + Adicionar primeira transação
                        </EmptyBtn>
                      </EmptyRow>
                    </tr>
                  ) : tabelaTransacoes.map(tx => {
                    const raw = getTransactionRawDate(tx);
                    const dt = parseDate(raw);
                    const dStr = dt ? dt.toLocaleDateString('pt-BR') : '—';
                    const isIn = tx.tipo === 'receita';
                    const highlighted = highlightedIds.includes(tx._id);
                    return (
                      <tr
                        key={tx._id}
                        style={highlighted ? {
                          background: 'rgba(59,130,246,0.10)',
                          boxShadow: 'inset 0 0 0 1px var(--dash-primary)',
                        } : undefined}
                      >
                        <td style={{ fontWeight: 500 }}>
                          {tx.descricao}
                          {tx.isImported && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--dash-primary)', marginTop: '0.2rem', fontWeight: 700 }}>
                              Importada via PDF
                            </div>
                          )}
                        </td>
                        <TdMuted>{resolveCatDisplay(tx.categoria).icon} {resolveCatDisplay(tx.categoria).label}</TdMuted>
                        <TdMuted>{dStr}</TdMuted>
                        <td style={{ color: isIn ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {isIn ? '+' : '-'} R$ {fmt(tx.valor)}
                        </td>
                        <td>
                          <DelBtn onClick={() => requestDelete(tx)} title="Excluir">
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

export default function Dashboard() {
  return <DashboardContent />;
}
