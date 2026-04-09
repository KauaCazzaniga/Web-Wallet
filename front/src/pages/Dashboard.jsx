import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import ImportButton from '../components/ImportButton';
import ImportModal from '../components/ImportModal';
import GerenciarMetas from '../components/GerenciarMetas';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { parseBankStatement } from '../utils/geminiParser';
import {
  GASTOS_FIXOS, GASTOS_FIXOS_PREFIX, GASTOS_FIXOS_MAP,
  resolverGastoFixo,
} from '../constants/gastosFixos';
import {
  CATEGORIAS_IMPORTACAO,
  gerarChaveTransacao,
  prepararTransacoesImportadas,
} from '../utils/categorizador';
import {
  Home, ArrowUpCircle, ArrowDownCircle, Wallet,
  Plus, AlertTriangle, X, Trash2, Settings, FileText, CheckCircle, LogOut, Moon, SunMedium
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
const MonthSelectorWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const MonthSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  padding: 0.5rem 2.25rem 0.5rem 0.875rem;
  border: 1px solid var(--dash-border);
  border-radius: 0.65rem;
  background-color: var(--dash-surface);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2389a0c7' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  color: var(--dash-heading);
  font-size: 0.875rem;
  font-weight: 700;
  outline: none;
  cursor: pointer;
  box-shadow: var(--dash-soft-shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
  min-width: 13rem;
  &:focus {
    border-color: var(--dash-primary);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.14);
  }
  option { font-weight: 400; background: var(--dash-surface); color: var(--dash-heading); }
`;
const MesBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.65rem;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  background: ${p => p.$hoje ? 'var(--dash-primary-soft)' : p.$dark ? 'rgba(120,80,0,0.25)' : '#fef3c7'};
  border: 1px solid ${p => p.$hoje ? 'var(--dash-primary)' : p.$dark ? 'rgba(251,191,36,0.35)' : '#fcd34d'};
  color: ${p => p.$hoje ? 'var(--dash-primary)' : p.$dark ? '#fcd34d' : '#92400e'};
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
const PaginacaoBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--dash-border);
  background: var(--dash-table-head);
  gap: 0.5rem;
  flex-wrap: wrap;
`;
const PaginacaoInfo = styled.span`
  font-size: 0.78rem;
  color: var(--dash-muted);
`;
const PaginacaoBtns = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;
const PagBtn = styled.button`
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--dash-border);
  border-radius: 0.45rem;
  background: ${p => p.$active ? 'var(--dash-primary)' : 'var(--dash-surface)'};
  color: ${p => p.$active ? '#fff' : 'var(--dash-heading)'};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:disabled { opacity: 0.35; cursor: default; }
  &:not(:disabled):hover { border-color: var(--dash-primary); color: ${p => p.$active ? '#fff' : 'var(--dash-primary)'}; }
`;

// ==========================================
// MÊS SELECIONADO — seletor + badge
// ==========================================
const HistoricBadge = styled.div`
  padding: 0.6rem 1rem; border-radius: 0.625rem; text-align: center; font-size: 0.75rem; font-weight: 500;
  background: ${p => p.$dark ? 'rgba(120,80,0,0.25)' : '#fef3c7'};
  border: 1px solid ${p => p.$dark ? 'rgba(251,191,36,0.35)' : '#fcd34d'};
  color: ${p => p.$dark ? '#fcd34d' : '#92400e'};
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
const formatarCompetencia = (comp) => {
  const [y, m] = String(comp).split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};


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

const ITEMS_POR_PAGINA = 15;

const EMPTY_RESUMO_MES = {
  saldo_inicial: 0,
  total_receitas: 0,
  total_despesas: 0,
  saldo_atual: 0,
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
    investimentos,
    highlightedIds,
    legacyImportedTransactions,
    metas,
    gastosFixosMetas,
    importTransactionsBatch,
    adicionarAporte,
    clearLegacyImportedTransactions,
  } = useFinance();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Dados do servidor ---
  const [transactions, setTransactions] = useState([]);  // estado próprio para remoção otimista
  const [resumoMes, setResumoMes] = useState(EMPTY_RESUMO_MES);

  // --- modais ---
  const [txModal, setTxModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, mode: 'single', id: null, count: 0 });
  const [importingExtract, setImportingExtract] = useState(false);
  const [importingSave, setImportingSave] = useState(false);
  const [migratingLegacyImports, setMigratingLegacyImports] = useState(false);
  const [importData, setImportData] = useState(EMPTY_IMPORT_STATE);

  // --- formulários ---
  const [txForm, setTxForm] = useState({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
  const [investmentModal, setInvestmentModal] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    mes: competenciaHoje(),
    valor: '',
    descricao: '',
  });

  // --- toast ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // --- mês selecionado ---
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    try {
      const saved = localStorage.getItem('webwallet_mes_selecionado');
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch {
      // Ignora falha de leitura do localStorage.
    }
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

  const notify = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  // ==========================================
  // MÊS SELECIONADO — lógica de navegação
  // ==========================================
  const mesAtual = competenciaHoje();
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
    try {
      localStorage.setItem('webwallet_mes_selecionado', next);
    } catch {
      // Ignora falha de persistencia do mes selecionado.
    }
  }, []);

  const fetchMesesDisponiveis = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/meses');
      setMesesDisponiveis(data.meses || []);
    } catch {
      setMesesDisponiveis([]);
    }
  }, []);

  useEffect(() => { fetchMesesDisponiveis(); }, [fetchMesesDisponiveis]);

  const handleAddMes = () => {
    const comp = `${addMesForm.ano}-${String(addMesForm.mes).padStart(2, '0')}`;
    const hoje = new Date();
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth() + 1;
    const eFuturo = addMesForm.ano > anoHoje || (addMesForm.ano === anoHoje && addMesForm.mes > mesHoje);
    if (eFuturo) { notify('Não é possível adicionar um mês futuro.', 'error'); return; }
    if (mesesDisponiveis.includes(comp)) { notify('Este mês já está na lista.', 'error'); return; }
    const novosMeses = [...mesesDisponiveis, comp].sort((a, b) => b.localeCompare(a));
    setMesesDisponiveis(novosMeses);
    handleMesSelecionadoChange(comp);
    setAddMesModal(false);
  };

  const fetchMesSelecionado = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingMes(true);

    try {
      const { data } = await api.get(`/wallet/extrato/${mesSelecionado}`);
      const transacoesAtivas = (data?.transacoes || []).filter((tx) => !tx.deletadoEm);

      setTransactions(transacoesAtivas);
      setResumoMes(data?.resumo || EMPTY_RESUMO_MES);
    } catch (err) {
      if (err?.response?.status === 404) {
        setTransactions([]);
        setResumoMes(EMPTY_RESUMO_MES);
      } else {
        console.error("Erro dashboard:", err);
        notify("Não foi possível carregar os dados", "error");
      }
    } finally {
      setLoading(false);
      if (!silent) setLoadingMes(false);
    }
  }, [mesSelecionado, notify]);

  useEffect(() => { fetchMesSelecionado(); }, [fetchMesSelecionado]);

  useEffect(() => { setPaginaAtual(1); }, [mesSelecionado]);

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

    const migrarImportacoesLegadas = async () => {
      setMigratingLegacyImports(true);

      try {
        const competenciasLegadas = Array.from(new Set(
          legacyImportedTransactions.map((transaction) => getTransactionCompetencia(transaction)).filter(Boolean),
        ));
        const transacoesServidor = await fetchTransactionsByCompetencia(competenciasLegadas);
        const chavesExistentes = new Set(
          transacoesServidor.map((transaction) => gerarChaveTransacao({
            data: String(getTransactionRawDate(transaction) || '').slice(0, 10),
            valor: transaction.valor,
            descricao: transaction.descricao,
          })),
        );

        const payload = legacyImportedTransactions.reduce((acc, transaction) => {
          const competenciaLegacy = getTransactionCompetencia(transaction);
          if (!competenciaLegacy) return acc;

          const chave = gerarChaveTransacao({
            data: String(getTransactionRawDate(transaction) || '').slice(0, 10),
            valor: transaction.valor,
            descricao: transaction.descricao,
          });

          if (chavesExistentes.has(chave)) return acc;
          chavesExistentes.add(chave);

          acc.push({
            tipo: transaction.tipo,
            categoria: transaction.categoria,
            valor: Number(transaction.valor),
            descricao: transaction.descricao,
            tags: Array.isArray(transaction.tags) ? transaction.tags : [],
            competencia: competenciaLegacy,
            data_hora: String(getTransactionRawDate(transaction) || '').slice(0, 10),
          });
          return acc;
        }, []);

        if (payload.length) {
          const { data } = await api.post('/wallet/transacoes/importar', { transacoes: payload });
          if (!cancelled) {
            await importTransactionsBatch(data?.transacoes || []);
            if (payload.some((transaction) => transaction.competencia === mesSelecionado)) {
              await fetchMesSelecionado({ silent: true });
            }
            notify(`${payload.length} transações antigas foram migradas para o banco.`);
          }
        }

        if (!cancelled) {
          clearLegacyImportedTransactions();
        }
      } catch {
        if (!cancelled) {
          notify('Não foi possível migrar importações antigas para o banco', 'error');
        }
      } finally {
        if (!cancelled) {
          setMigratingLegacyImports(false);
        }
      }
    };

    migrarImportacoesLegadas();

    return () => {
      cancelled = true;
    };
  }, [
    clearLegacyImportedTransactions,
    fetchMesSelecionado,
    fetchTransactionsByCompetencia,
    importTransactionsBatch,
    legacyImportedTransactions,
    mesSelecionado,
    migratingLegacyImports,
    notify,
  ]);

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

      const competenciasExtrato = Array.from(new Set(
        transacoesPreparadas
          .map((transaction) => transaction.data?.slice(0, 7))
          .filter(Boolean),
      ));

      const transacoesServidor = await fetchTransactionsByCompetencia(competenciasExtrato);

      const chavesExistentes = new Set(
        transacoesServidor.map((transaction) =>
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
    } catch (err) {
      console.error('[ImportarExtrato]', err);
      notify(err?.message || 'Erro ao importar extrato', 'error');
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

  const handleImportTypeChange = (idLocal, tipo) => {
    setImportData((current) => ({
      ...current,
      transacoes: current.transacoes.map((transaction) =>
        transaction.idLocal === idLocal ? { ...transaction, tipo } : transaction,
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
      const payload = selecionadas.map((transaction) => ({
        tipo: transaction.tipo,
        categoria: transaction.categoria,
        valor: Number(transaction.valor),
        descricao: transaction.descricao,
        tags: Array.isArray(transaction.tags) ? transaction.tags : [],
        competencia: transaction.data?.slice(0, 7) || mesSelecionado || competenciaHoje(),
        data_hora: transaction.data,
      }));
      const { data } = await api.post('/wallet/transacoes/importar', { transacoes: payload });
      const adicionadas = await importTransactionsBatch(data?.transacoes || []);

      closeImportModal();
      await fetchMesSelecionado({ silent: true });
      fetchMesesDisponiveis();
      notify(`${adicionadas.length} transações importadas com sucesso`);
    } catch (err) {
      console.error('[ConfirmarImport]', err);
      notify(err?.message || 'Não foi possível salvar as transações importadas', 'error');
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
      const comp = mesSelecionado || competenciaHoje();
      await api.post('/wallet/transacao', {
        ...txForm, descricao: desc, valor: Number(txForm.valor), competencia: comp
      });
      setTxModal(false);
      setTxForm({ tipo: 'despesa', valor: '', descricao: '', categoria: 'Alimentação' });
      await fetchMesSelecionado({ silent: true });
      fetchMesesDisponiveis();
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
    setDelConfirm({ open: true, mode: 'single', id: transaction?._id, count: 1 });
  };

  const requestDeleteAll = () => {
    if (!transacoesMes.length) {
      notify("NÃ£o hÃ¡ transaÃ§Ãµes para excluir neste mÃªs", "error");
      return;
    }

    setDelConfirm({ open: true, mode: 'all', id: null, count: transacoesMes.length });
  };

  const confirmDelete = async () => {
    const id = delConfirm.id;
    const txToDelete = transactions.find(tx => tx._id === id);

    // 1. Remove da tela IMEDIATAMENTE
    setTransactions(prev => prev.filter(tx => tx._id !== id));
    setDelConfirm({ open: false, mode: 'single', id: null, count: 0 });
    notify("Transação removida!");

    // 2. Persiste no backend (sem bloquear a UI)
    try {
      await api.delete(`/wallet/transacao/${id}`, {
        data: { competencia: getTransactionCompetencia(txToDelete) || mesSelecionado || competenciaHoje() },
      });
      await fetchMesSelecionado({ silent: true });
    } catch (err) {
      console.error("Erro ao excluir:", err);
      notify("Erro ao excluir — recarregue a página", "error");
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
        if (bulkError?.response?.status !== 404) {
          throw bulkError;
        }

        const resultados = await Promise.allSettled(
          transacoesParaExcluir.map((transaction) => {
            const competencia = getTransactionCompetencia(transaction) || mesSelecionado || competenciaHoje();
            return api.delete(`/wallet/${competencia}/transacao/${transaction._id}`);
          }),
        );

        removidas = resultados.filter((resultado) => resultado.status === 'fulfilled').length;

        if (!removidas) {
          throw bulkError;
        }
      }

      const data = { removidas };
      await fetchMesSelecionado({ silent: true });
      notify(`${data?.removidas || quantidadeAtual} transaÃ§Ãµes removidas!`);
    } catch (err) {
      console.error("Erro ao excluir tudo:", err);
      notify("Erro ao excluir transaÃ§Ãµes â€” recarregue a pÃ¡gina", "error");
      await fetchMesSelecionado({ silent: true });
    }
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

  // ==========================================
  // DADOS DERIVADOS — filtrados por mesSelecionado
  // ==========================================

  const transacoesMes = useMemo(
    () => [...transactions].sort(sortTransactionsByDateDesc),
    [transactions],
  );

  const mesesEfetivos = useMemo(() => {
    const set = new Set(mesesDisponiveis);
    if (!set.has(mesSelecionado)) {
      return [mesSelecionado, ...mesesDisponiveis].sort((a, b) => b.localeCompare(a));
    }
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

  // Deriva limites flat (compatível com ProgressBar, gfMetas, totalOrcamento)
  const limites = useMemo(() => {
    const result = { ...metas };
    Object.entries(gastosFixosMetas).forEach(([k, v]) => { result[GASTOS_FIXOS_PREFIX + k] = v; });
    return result;
  }, [metas, gastosFixosMetas]);

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
    } catch {
      // Ignora falha de leitura do localStorage.
    }
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
      try { localStorage.setItem('webwallet_gastosfixos_aberto', 'true'); } catch {
        // Ignora falha de persistencia do acordeao.
      }
    }
  }, [gfGastos, gfMetas]);

  const toggleGastosFixos = useCallback(() => {
    setGastosFixosAberto(prev => {
      const next = !prev;
      try { localStorage.setItem('webwallet_gastosfixos_aberto', String(next)); } catch {
        // Ignora falha de persistencia do acordeao.
      }
      return next;
    });
  }, []);

  const totalOrcamento = Object.values(limites).reduce((a, b) => a + Number(b), 0);
  const totalDespesas = kpiDespesas;
  const acima = totalOrcamento > 0 && totalDespesas > totalOrcamento;
  const totalInvestido = useMemo(
    () => investimentos.reduce((acc, investimento) => acc + Number(investimento.valor || 0), 0),
    [investimentos],
  );
  const aporteMesSelecionado = useMemo(
    () => investimentos
      .filter((investimento) => investimento.mes === mesSelecionado)
      .reduce((acc, investimento) => acc + Number(investimento.valor || 0), 0),
    [investimentos, mesSelecionado],
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

      {/* MODAL: ADICIONAR MÊS */}
      {addMesModal && (
        <ModalOverlay onClick={e => e.target === e.currentTarget && setAddMesModal(false)}>
          <ModalContent $sm>
            <ModalHeader>
              <h3>Adicionar mês</h3>
              <button onClick={() => setAddMesModal(false)}><X size={18} /></button>
            </ModalHeader>
            <FormGroup>
              <label>Mês</label>
              <select
                value={addMesForm.mes}
                onChange={e => setAddMesForm(f => ({ ...f, mes: Number(e.target.value) }))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, m - 1, 1));
                  return <option key={m} value={m}>{nome.charAt(0).toUpperCase() + nome.slice(1)}</option>;
                })}
              </select>
            </FormGroup>
            <FormGroup>
              <label>Ano</label>
              <input
                type="number"
                value={addMesForm.ano}
                min={2000}
                max={new Date().getFullYear()}
                onChange={e => setAddMesForm(f => ({ ...f, ano: Number(e.target.value) }))}
              />
            </FormGroup>
            <ModalFooter>
              <button className="cancel" onClick={() => setAddMesModal(false)}>Cancelar</button>
              <button className="save" onClick={handleAddMes}>Confirmar</button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {delConfirm.open && delConfirm.mode === 'single' && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDelConfirm({ open: false, mode: 'single', id: null, count: 0 })}
        />
      )}

      {delConfirm.open && delConfirm.mode === 'all' && (
        <ConfirmActionModal
          title="Excluir todas as transações"
          message={`Tem certeza que deseja excluir todas as ${delConfirm.count} transações deste mês?`}
          confirmLabel="Excluir tudo"
          onConfirm={confirmDeleteAll}
          onCancel={() => setDelConfirm({ open: false, mode: 'single', id: null, count: 0 })}
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
        onChangeType={handleImportTypeChange}
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
          <MonthSelectorWrap>
            <MonthSelect
              value={mesSelecionado}
              onChange={(e) => {
                if (e.target.value === '__add__') { setAddMesModal(true); }
                else { handleMesSelecionadoChange(e.target.value); }
              }}
            >
              {mesesEfetivos.map(mes => (
                <option key={mes} value={mes}>{formatarCompetencia(mes)}</option>
              ))}
              <option value="__add__">＋ Adicionar mês</option>
            </MonthSelect>
            <MesBadge $hoje={ehMesAtual} $dark={isDark}>
              {ehMesAtual ? 'Hoje' : 'Histórico'}
            </MesBadge>
          </MonthSelectorWrap>
          <HeaderActions>
            <ImportButton
              loading={importingExtract}
              disabled={!ehMesAtual}
              onSelectFile={handleImportFile}
              onError={(message) => notify(message, 'error')}
            />
            <AddButton onClick={() => setTxModal(true)} disabled={!ehMesAtual}>
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
                  <span>Aporte do mês</span>
                  <strong>{fmtCurrency(aporteMesSelecionado)}</strong>
                </InvestmentStat>
              </InvestmentStats>

              <InvestmentAction onClick={openInvestmentModal} disabled={!ehMesAtual}>
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
                  <GerenciarMetas mesSelecionado={mesSelecionado} notify={notify} />
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
              <TxHeader><h3>Transações — {labelMes}</h3></TxHeader>
              {transacoesMes.length > 0 && (
                <div style={{ padding: '0 1.5rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <TextLink type="button" onClick={requestDeleteAll}>
                    <Trash2 size={14} /> Excluir tudo
                  </TextLink>
                </div>
              )}
              <Table>
                <thead>
                  <tr>
                    <th>Descrição</th><th>Categoria</th>
                    <th>Data</th><th>Valor</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMes ? (
                    <tr>
                      <EmptyRow colSpan={5}>Carregando transações de {labelMes}...</EmptyRow>
                    </tr>
                  ) : transacoesMes.length === 0 ? (
                    <tr>
                      <EmptyRow colSpan={5}>
                        Nenhuma transação em {labelMes}.
                        <EmptyBtn onClick={() => setTxModal(true)}>
                          + Adicionar primeira transação
                        </EmptyBtn>
                      </EmptyRow>
                    </tr>
                  ) : transacoesPaginadas.map(tx => {
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
                          {tx.importadoViaPdf && (
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

              {transacoesMes.length > ITEMS_POR_PAGINA && (
                <PaginacaoBar>
                  <PaginacaoInfo>
                    {(paginaAtual - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(paginaAtual * ITEMS_POR_PAGINA, transacoesMes.length)} de {transacoesMes.length} transações
                  </PaginacaoInfo>
                  <PaginacaoBtns>
                    <PagBtn
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                    >
                      ‹ Anterior
                    </PagBtn>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaAtual) <= 1)
                      .reduce((acc, n, idx, arr) => {
                        if (idx > 0 && arr[idx - 1] !== n - 1) acc.push('…');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '…'
                          ? <PagBtn key={`ellipsis-${idx}`} disabled>…</PagBtn>
                          : <PagBtn key={item} $active={item === paginaAtual} onClick={() => setPaginaAtual(item)}>{item}</PagBtn>
                      )
                    }
                    <PagBtn
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                    >
                      Próxima ›
                    </PagBtn>
                  </PaginacaoBtns>
                </PaginacaoBar>
              )}
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
