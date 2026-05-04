import React, { useState, useEffect, useCallback, useContext } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Home, FileText, Settings, LogOut, Moon, SunMedium, Wallet,
  Plus, Pencil, Trash2, Check, X, Download, Tag, Target,
  Menu, Save, Sliders, FileDown, Package, ChevronRight,
  AlertCircle, CheckCircle2, TrendingUp,
} from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import api from '../services/api';
import { CAT_ICONS, competenciaHoje } from '../components/dashboard/dashboardUtils';
import { GASTOS_FIXOS } from '../constants/gastosFixos';

// ── Storage keys ──────────────────────────────────────────────────────────────
const CUSTOM_CATS_KEY  = (uk) => `webwallet_custom_cats:${uk}`;
const SAVINGS_RATE_KEY = (uk) => `webwallet_taxa_poupanca:${uk}`;
const HIDDEN_CATS_KEY  = (uk) => `webwallet_hidden_cats:${uk}`;
const HIDDEN_GF_KEY    = (uk) => `webwallet_hidden_gf:${uk}`;

// ── Built-in categories (cannot be deleted) ───────────────────────────────────
const DEFAULT_CATS = Object.entries(CAT_ICONS).map(([label, icon]) => ({
  key: label,
  label,
  icon,
  isDefault: true,
}));

// ── Emoji palette for new categories ─────────────────────────────────────────
const EMOJI_OPTIONS = [
  '🏠','💡','🎓','✈️','🎮','💻','👕','🐾','🎁','📱',
  '🔧','🏋️','🎵','📚','🍕','🛒','⚡','🌿','☕','🧴',
  '🎨','🚲','🏊','🧘','🎯','🎲','🔬','💈','🎤','🌍',
];

// ── Month range helpers ───────────────────────────────────────────────────────
const listMonthsBetween = (from, to) => {
  const result = [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
};

const fmtCurrencyBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// ── AppContainer ──────────────────────────────────────────────────────────────
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  font-family: "Inter", sans-serif;
  color: var(--cfg-heading);
  background: ${p => p.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 24%), linear-gradient(180deg, #04101f 0%, #071425 45%, #030b15 100%)'
    : 'linear-gradient(180deg, #eff4ff 0%, #f8fbff 100%)'};

  --cfg-shell:          ${p => p.$dark ? 'rgba(7,18,35,0.92)'     : '#ffffff'};
  --cfg-surface:        ${p => p.$dark ? 'rgba(9,20,38,0.88)'     : '#ffffff'};
  --cfg-surface-muted:  ${p => p.$dark ? 'rgba(13,29,54,0.86)'    : '#f6f9ff'};
  --cfg-border:         ${p => p.$dark ? 'rgba(96,165,250,0.16)'  : '#d8e3f3'};
  --cfg-border-strong:  ${p => p.$dark ? 'rgba(96,165,250,0.3)'   : '#bfd0ea'};
  --cfg-heading:        ${p => p.$dark ? '#eff6ff'  : '#0f172a'};
  --cfg-text:           ${p => p.$dark ? '#c6d4f1'  : '#334155'};
  --cfg-muted:          ${p => p.$dark ? '#89a0c7'  : '#7184a0'};
  --cfg-muted-strong:   ${p => p.$dark ? '#bfd0ea'  : '#4f5f7a'};
  --cfg-primary:        ${p => p.$dark ? '#60a5fa'  : '#2563eb'};
  --cfg-primary-strong: ${p => p.$dark ? '#3b82f6'  : '#1d4ed8'};
  --cfg-primary-soft:   ${p => p.$dark ? 'rgba(96,165,250,0.16)'  : '#dbeafe'};
  --cfg-input-bg:       ${p => p.$dark ? 'rgba(6,18,34,0.92)'     : '#f8fbff'};
  --cfg-danger-soft:    ${p => p.$dark ? 'rgba(127,29,29,0.3)'    : '#fef2f2'};
  --cfg-danger-border:  ${p => p.$dark ? 'rgba(248,113,113,0.34)' : '#fecaca'};
  --cfg-shadow:         ${p => p.$dark ? '0 18px 40px rgba(2,12,27,0.38)'  : '0 16px 36px rgba(15,23,42,0.08)'};
  --cfg-soft-shadow:    ${p => p.$dark ? '0 10px 28px rgba(2,12,27,0.3)'   : '0 10px 28px rgba(15,23,42,0.05)'};
  --cfg-success-soft:   ${p => p.$dark ? 'rgba(20,83,45,0.35)'    : '#f0fdf4'};
  --cfg-success-border: ${p => p.$dark ? 'rgba(74,222,128,0.3)'   : '#bbf7d0'};
`;

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = styled.aside`
  width: 240px;
  background: var(--cfg-shell);
  border-right: 1px solid var(--cfg-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  flex-shrink: 0;
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
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0 1.5rem; font-size: 1.25rem; font-weight: 700;
  color: var(--cfg-primary); margin-bottom: 2rem;
`;
const NavMenu = styled.nav`
  flex: 1; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;
`;
const NavItem = styled.button`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 1rem; border: none; border-radius: 0.625rem;
  cursor: pointer; transition: all 0.15s; width: 100%;
  text-align: left; font-size: 0.875rem;
  background: ${p => p.$active ? 'var(--cfg-primary-soft)' : 'transparent'};
  color:      ${p => p.$active ? 'var(--cfg-primary)'      : 'var(--cfg-muted)'};
  font-weight:${p => p.$active ? '600' : '400'};
  &:hover { background: ${p => p.$active ? 'var(--cfg-primary-soft)' : 'var(--cfg-surface-muted)'}; }
  svg { transition: transform 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); }
`;
const SidebarFooter = styled.div`padding: 1rem 0.75rem 0; margin-top: auto; display: grid; gap: 0.75rem;`;
const ThemeToggleBox = styled.button`
  display: flex; align-items: center; justify-content: space-between; gap: 0.9rem; width: 100%;
  padding: 0.82rem 1rem; border: 1px solid var(--cfg-border); border-radius: 0.95rem;
  cursor: pointer; background: ${p => p.$dark ? 'rgba(10,24,44,.85)' : '#ffffff'};
  color: var(--cfg-heading); box-shadow: var(--cfg-soft-shadow);
  transition: transform .22s ease, filter .22s ease;
  &:hover { transform: translateY(-2px); filter: brightness(1.05); }
`;
const ThemeToggleMeta = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  strong { display: block; font-size: 0.9rem; }
  span   { display: block; font-size: 0.76rem; color: var(--cfg-muted); }
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
const LogoutButton = styled.button`
  display: flex; align-items: center; gap: 0.75rem; width: 100%;
  padding: 0.8rem 1rem; border: none; border-radius: 0.75rem;
  background: var(--cfg-danger-soft); color: #ef4444; cursor: pointer;
  font-size: 0.9rem; font-weight: 600; text-align: left; transition: all 0.15s;
  box-shadow: inset 0 0 0 1px var(--cfg-danger-border);
  &:hover { filter: brightness(1.05); }
`;

// ── Main layout ───────────────────────────────────────────────────────────────
const MobileHeader = styled.header`
  display: none;
  @media (max-width: 768px) {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; background: var(--cfg-shell);
    border-bottom: 1px solid var(--cfg-border); position: sticky; top: 0; z-index: 10;
  }
`;
const MenuBtn = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: flex; align-items: center; justify-content: center;
    width: 2.25rem; height: 2.25rem; border: none; border-radius: 0.5rem;
    background: var(--cfg-surface-muted); color: var(--cfg-heading); cursor: pointer;
  }
`;
const MainContent = styled.main`flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;`;
const ContentArea = styled.div`
  flex: 1; padding: 2rem 2.5rem; overflow-y: auto;
  @media (max-width: 1024px) { padding: 1.5rem; }
  @media (max-width: 768px)  { padding: 1rem; }
`;
const ContentWrapper = styled.div`max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;`;

// ── Page header ───────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  animation: ${fadeUp} 0.4s ease both;
`;
const PageTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em;
  color: var(--cfg-heading);
`;
const PageDesc = styled.p`
  margin: 0; color: var(--cfg-muted); font-size: 0.9rem; line-height: 1.6;
`;

// ── Section tabs ──────────────────────────────────────────────────────────────
const TabsRow = styled.div`
  display: flex; gap: 0.5rem; flex-wrap: wrap;
  animation: ${fadeUp} 0.4s ease 0.05s both;
`;
const TabBtn = styled.button`
  display: inline-flex; align-items: center; gap: 0.55rem;
  padding: 0.6rem 1.1rem; border-radius: 0.75rem; border: 1px solid;
  cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.15s;
  background: ${p => p.$active ? 'var(--cfg-primary)' : 'var(--cfg-surface)'};
  color:      ${p => p.$active ? '#ffffff'             : 'var(--cfg-muted)'};
  border-color: ${p => p.$active ? 'var(--cfg-primary)' : 'var(--cfg-border)'};
  box-shadow: ${p => p.$active ? '0 6px 20px rgba(37,99,235,0.3)' : 'var(--cfg-soft-shadow)'};
  &:hover { transform: ${p => p.$active ? 'none' : 'translateY(-2px)'}; }
`;

// ── Generic panel / card ──────────────────────────────────────────────────────
const Panel = styled.div`
  background: var(--cfg-surface);
  border: 1px solid var(--cfg-border);
  border-radius: 1rem;
  box-shadow: var(--cfg-soft-shadow);
  overflow: hidden;
  animation: ${fadeUp} 0.35s ease both;
`;
const PanelHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--cfg-border);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
`;
const PanelTitle = styled.h2`
  margin: 0; font-size: 1rem; font-weight: 700; color: var(--cfg-heading);
  display: flex; align-items: center; gap: 0.6rem;
`;
const PanelDesc = styled.p`
  margin: 0.25rem 0 0; font-size: 0.82rem; color: var(--cfg-muted); line-height: 1.5;
`;
const PanelBody = styled.div`padding: 1.5rem;`;

// ── CATEGORIES SECTION ────────────────────────────────────────────────────────
const CatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`;
const CatCard = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem; border-radius: 0.75rem;
  background: var(--cfg-surface-muted);
  border: 1px solid ${p => p.$editing ? 'var(--cfg-primary)' : 'var(--cfg-border)'};
  transition: border-color 0.15s, box-shadow 0.15s;
  position: relative;
  &:hover { border-color: var(--cfg-border-strong); }
`;
const CatEmoji = styled.span`font-size: 1.4rem; flex-shrink: 0; line-height: 1;`;
const CatName = styled.span`
  font-size: 0.875rem; font-weight: 600; color: var(--cfg-heading);
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const CatActions = styled.div`
  display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.15s;
  ${CatCard}:hover & { opacity: 1; }
`;
const IconBtn = styled.button`
  width: 1.75rem; height: 1.75rem; display: grid; place-items: center;
  border: none; border-radius: 0.4rem; cursor: pointer; transition: all 0.15s;
  background: ${p => p.$danger ? 'var(--cfg-danger-soft)' : 'var(--cfg-primary-soft)'};
  color: ${p => p.$danger ? '#ef4444' : 'var(--cfg-primary)'};
  &:hover { filter: brightness(1.1); transform: scale(1.1); }
`;
const DefaultBadge = styled.span`
  font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem;
  border-radius: 999px; background: var(--cfg-primary-soft);
  color: var(--cfg-primary); letter-spacing: 0.05em; text-transform: uppercase;
  flex-shrink: 0;
`;
const InlineInput = styled.input`
  flex: 1; font-size: 0.875rem; font-weight: 600; background: transparent;
  border: none; outline: none; color: var(--cfg-heading); min-width: 0;
  font-family: inherit;
`;
const AddCatPanel = styled.div`
  margin-top: 1.25rem; padding: 1.25rem;
  background: var(--cfg-surface-muted); border-radius: 0.875rem;
  border: 1px dashed var(--cfg-border-strong);
`;
const AddCatTitle = styled.p`
  margin: 0 0 0.875rem; font-size: 0.875rem; font-weight: 600;
  color: var(--cfg-muted-strong); display: flex; align-items: center; gap: 0.5rem;
`;
const EmojiPicker = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.875rem;
`;
const EmojiBtn = styled.button`
  width: 2.1rem; height: 2.1rem; border: 1px solid;
  border-radius: 0.5rem; font-size: 1.1rem; cursor: pointer; transition: all 0.12s;
  background: ${p => p.$sel ? 'var(--cfg-primary-soft)' : 'var(--cfg-surface)'};
  border-color: ${p => p.$sel ? 'var(--cfg-primary)' : 'var(--cfg-border)'};
  &:hover { transform: scale(1.15); }
`;
const AddCatRow = styled.div`display: flex; gap: 0.6rem; align-items: center;`;
const TextInput = styled.input`
  flex: 1; padding: 0.65rem 0.875rem; border-radius: 0.625rem;
  border: 1px solid var(--cfg-border); background: var(--cfg-input-bg);
  color: var(--cfg-heading); font-size: 0.875rem; font-family: inherit;
  outline: none; transition: border-color 0.15s;
  &:focus { border-color: var(--cfg-primary); }
  &::placeholder { color: var(--cfg-muted); }
`;
const PrimaryBtn = styled.button`
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.1rem; border-radius: 0.625rem; border: none;
  background: var(--cfg-primary); color: #fff;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
  &:hover { transform: translateY(-2px); filter: brightness(1.08); }
  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
`;
const DividerLabel = styled.p`
  font-size: 0.75rem; font-weight: 700; color: var(--cfg-muted);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin: 1.25rem 0 0.75rem;
`;
const HiddenPanel = styled.div`
  margin-top: 1.25rem; padding: 1.25rem;
  background: var(--cfg-danger-soft); border-radius: 0.875rem;
  border: 1px dashed var(--cfg-danger-border);
`;
const HiddenPanelTitle = styled.p`
  margin: 0 0 0.875rem; font-size: 0.875rem; font-weight: 600;
  color: var(--cfg-muted-strong); display: flex; align-items: center; gap: 0.5rem;
`;
const RestoreBtn = styled.button`
  width: 1.75rem; height: 1.75rem; display: grid; place-items: center;
  border: none; border-radius: 0.4rem; cursor: pointer; transition: all 0.15s;
  background: var(--cfg-success-soft); color: #10b981;
  box-shadow: inset 0 0 0 1px var(--cfg-success-border);
  &:hover { filter: brightness(1.1); transform: scale(1.1); }
`;

// ── GOALS SECTION ─────────────────────────────────────────────────────────────
const GoalsGrid = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const GoalCard = styled.div`
  display: grid; grid-template-columns: 2.5rem 1fr auto;
  gap: 0.75rem; align-items: center;
  padding: 0.875rem 1rem; border-radius: 0.75rem;
  background: var(--cfg-surface-muted);
  border: 1px solid var(--cfg-border); transition: border-color 0.15s;
  &:hover { border-color: var(--cfg-border-strong); }
  @media (max-width: 580px) {
    grid-template-columns: 2rem 1fr;
    grid-template-rows: auto auto;
  }
`;
const GoalEmoji = styled.span`font-size: 1.3rem; text-align: center;`;
const GoalInfo = styled.div`min-width: 0;`;
const GoalLabel = styled.p`
  margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--cfg-heading);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const SliderRow = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const RangeInput = styled.input`
  flex: 1; -webkit-appearance: none; height: 0.35rem; border-radius: 999px;
  background: linear-gradient(to right, var(--cfg-primary) ${p => p.$pct}%, var(--cfg-border) ${p => p.$pct}%);
  outline: none; cursor: pointer; transition: background 0.1s;
  &::-webkit-slider-thumb {
    -webkit-appearance: none; width: 1.1rem; height: 1.1rem;
    border-radius: 50%; background: var(--cfg-primary);
    box-shadow: 0 2px 8px rgba(37,99,235,0.35); cursor: pointer;
    transition: transform 0.15s;
  }
  &::-webkit-slider-thumb:hover { transform: scale(1.2); }
`;
const GoalAmountInput = styled.input`
  width: 7.5rem; padding: 0.5rem 0.7rem; border-radius: 0.5rem;
  border: 1px solid var(--cfg-border); background: var(--cfg-input-bg);
  color: var(--cfg-heading); font-size: 0.875rem; font-family: inherit;
  text-align: right; outline: none; transition: border-color 0.15s;
  &:focus { border-color: var(--cfg-primary); }
  @media (max-width: 580px) { grid-column: 1 / -1; width: 100%; }
`;
const SavingsCard = styled.div`
  padding: 1.25rem; border-radius: 0.875rem;
  background: linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(6,182,212,0.08) 100%);
  border: 1px solid var(--cfg-primary-soft);
  display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;
  @media (max-width: 580px) { grid-template-columns: 1fr; }
`;
const SavingsInfo = styled.div``;
const SavingsTitle = styled.p`
  margin: 0 0 0.3rem; font-size: 0.9rem; font-weight: 700; color: var(--cfg-heading);
  display: flex; align-items: center; gap: 0.5rem;
`;
const SavingsDesc = styled.p`margin: 0; font-size: 0.8rem; color: var(--cfg-muted);`;
const SavingsControl = styled.div`
  display: flex; align-items: center; gap: 0.75rem; min-width: 220px;
  @media (max-width: 580px) { min-width: 0; }
`;
const SavingsPct = styled.span`
  font-size: 1.25rem; font-weight: 800; color: var(--cfg-primary);
  min-width: 3rem; text-align: right;
`;
const SaveGoalsBtn = styled(PrimaryBtn)`
  padding: 0.8rem 1.5rem; font-size: 0.9rem; margin-top: 0.5rem;
`;

// ── EXPORT SECTION ────────────────────────────────────────────────────────────
const ExportGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const ExportCard = styled.div`
  padding: 1.25rem; border-radius: 0.875rem;
  background: var(--cfg-surface-muted); border: 1px solid var(--cfg-border);
  display: flex; flex-direction: column; gap: 0.75rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: var(--cfg-border-strong); box-shadow: var(--cfg-soft-shadow); }
`;
const ExportCardTitle = styled.p`
  margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--cfg-heading);
  display: flex; align-items: center; gap: 0.6rem;
`;
const ExportCardDesc = styled.p`
  margin: 0; font-size: 0.82rem; color: var(--cfg-muted); line-height: 1.55;
`;
const FormatBadge = styled.span`
  display: inline-flex; align-items: center; padding: 0.2rem 0.6rem;
  border-radius: 0.35rem; font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  background: var(--cfg-primary-soft); color: var(--cfg-primary);
`;
const MonthRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; align-items: end;
`;
const FieldLabel = styled.label`
  display: block; font-size: 0.75rem; font-weight: 600; color: var(--cfg-muted);
  margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em;
`;
const MonthInput = styled.input`
  width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.5rem;
  border: 1px solid var(--cfg-border); background: var(--cfg-input-bg);
  color: var(--cfg-heading); font-size: 0.85rem; font-family: inherit;
  outline: none; transition: border-color 0.15s;
  &:focus { border-color: var(--cfg-primary); }
`;
const DownloadBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.75rem; border-radius: 0.625rem; border: none;
  cursor: pointer; font-size: 0.875rem; font-weight: 700; transition: all 0.15s;
  background: ${p => p.$loading
    ? 'var(--cfg-surface-muted)'
    : 'linear-gradient(135deg, #06b6d4 0%, var(--cfg-primary) 52%, #4f46e5 100%)'};
  color: ${p => p.$loading ? 'var(--cfg-muted)' : '#fff'};
  box-shadow: ${p => p.$loading ? 'none' : '0 8px 20px rgba(37,99,235,0.3)'};
  &:hover { transform: ${p => p.$loading ? 'none' : 'translateY(-2px)'}; filter: ${p => p.$loading ? 'none' : 'brightness(1.06)'}; }
  &:disabled { cursor: not-allowed; }
`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastContainer = styled.div`
  position: fixed; bottom: 2rem; right: 2rem; z-index: 500;
  display: flex; flex-direction: column; gap: 0.5rem;
`;
const Toast = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1.25rem; border-radius: 0.75rem;
  background: ${p => p.$type === 'error' ? '#ef4444' : p.$type === 'success' ? '#10b981' : '#2563eb'};
  color: #fff; font-size: 0.875rem; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18); min-width: 240px;
  animation: ${slideRight} 0.25s ease-out;
`;

// ── SECTION: Categorias ───────────────────────────────────────────────────────
function CategoriesSection({ userKey, isDark }) {
  const {
    hiddenCatLabels: hiddenDefaults, setHiddenCatLabels: saveHiddenDefaultsCtx,
    hiddenGfKeys: hiddenGf,          setHiddenGfKeys:    saveHiddenGfCtx,
  } = useFinance();
  const [customCats, setCustomCats] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue]   = useState('');
  const [newEmoji, setNewEmoji]     = useState('🏷️');
  const [newName, setNewName]       = useState('');
  const [notify, setNotify]         = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATS_KEY(userKey));
      setCustomCats(raw ? JSON.parse(raw) : []);
    } catch { setCustomCats([]); }
  }, [userKey]);

  const saveCustom = useCallback((updated) => {
    setCustomCats(updated);
    localStorage.setItem(CUSTOM_CATS_KEY(userKey), JSON.stringify(updated));
  }, [userKey]);

  const saveHiddenDefaults = useCallback((updated) => saveHiddenDefaultsCtx(updated), [saveHiddenDefaultsCtx]);
  const saveHiddenGf       = useCallback((updated) => saveHiddenGfCtx(updated), [saveHiddenGfCtx]);

  const showToast = (msg, type = 'success') => {
    setNotify({ msg, type });
    setTimeout(() => setNotify(null), 3000);
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return showToast('Digite um nome para a categoria.', 'error');
    const allLabels = [...DEFAULT_CATS.map(c => c.label), ...customCats.map(c => c.label)];
    if (allLabels.some(l => l.toLowerCase() === name.toLowerCase())) {
      return showToast('Já existe uma categoria com esse nome.', 'error');
    }
    const key = `custom_${Date.now()}`;
    saveCustom([...customCats, { key, label: name, icon: newEmoji, isDefault: false }]);
    setNewName('');
    setNewEmoji('🏷️');
    showToast(`"${name}" adicionada com sucesso!`);
  };

  const handleDeleteCustom = (key) => {
    saveCustom(customCats.filter(c => c.key !== key));
    showToast('Categoria removida.');
  };

  const handleHideDefault = (key) => {
    saveHiddenDefaults([...hiddenDefaults, key]);
    showToast('Categoria ocultada. Você pode restaurá-la abaixo.');
  };

  const handleRestoreDefault = (key) => {
    saveHiddenDefaults(hiddenDefaults.filter(k => k !== key));
    showToast('Categoria restaurada!');
  };

  const handleHideGf = (key) => {
    saveHiddenGf([...hiddenGf, key]);
    showToast('Subcategoria ocultada. Você pode restaurá-la abaixo.');
  };

  const handleRestoreGf = (key) => {
    saveHiddenGf(hiddenGf.filter(k => k !== key));
    showToast('Subcategoria restaurada!');
  };

  const startEdit = (cat) => { setEditingKey(cat.key); setEditValue(cat.label); };

  const confirmEdit = (key) => {
    const name = editValue.trim();
    if (!name) return setEditingKey(null);
    const allLabels = [
      ...DEFAULT_CATS.map(c => c.label),
      ...customCats.filter(c => c.key !== key).map(c => c.label),
    ];
    if (allLabels.some(l => l.toLowerCase() === name.toLowerCase())) {
      showToast('Já existe uma categoria com esse nome.', 'error');
      return setEditingKey(null);
    }
    saveCustom(customCats.map(c => c.key === key ? { ...c, label: name } : c));
    setEditingKey(null);
    showToast('Categoria renomeada!');
  };

  const visibleDefaults = DEFAULT_CATS.filter(c => !hiddenDefaults.includes(c.key));
  const hiddenDefaultItems = DEFAULT_CATS.filter(c => hiddenDefaults.includes(c.key));
  const visibleGf = GASTOS_FIXOS.filter(gf => !hiddenGf.includes(gf.key));
  const hiddenGfItems = GASTOS_FIXOS.filter(gf => hiddenGf.includes(gf.key));
  const hasHidden = hiddenDefaultItems.length > 0 || hiddenGfItems.length > 0;

  return (
    <>
      {notify && (
        <ToastContainer>
          <Toast $type={notify.type}>
            {notify.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {notify.msg}
          </Toast>
        </ToastContainer>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle><Tag size={18} /> Categorias padrão</PanelTitle>
            <PanelDesc>Passe o mouse para ver a opção de ocultar uma categoria</PanelDesc>
          </div>
        </PanelHeader>
        <PanelBody>
          <CatGrid>
            {visibleDefaults.map(cat => (
              <CatCard key={cat.key}>
                <CatEmoji>{cat.icon}</CatEmoji>
                <CatName>{cat.label}</CatName>
                <CatActions>
                  <IconBtn $danger onClick={() => handleHideDefault(cat.key)} title="Ocultar categoria">
                    <Trash2 size={13} />
                  </IconBtn>
                </CatActions>
              </CatCard>
            ))}
          </CatGrid>

          <DividerLabel>Gastos fixos (subcategorias padrão)</DividerLabel>
          <CatGrid>
            {visibleGf.map(gf => (
              <CatCard key={gf.key}>
                <CatEmoji>{gf.icon}</CatEmoji>
                <CatName>{gf.label}</CatName>
                <CatActions>
                  <IconBtn $danger onClick={() => handleHideGf(gf.key)} title="Ocultar subcategoria">
                    <Trash2 size={13} />
                  </IconBtn>
                </CatActions>
              </CatCard>
            ))}
          </CatGrid>

          {hasHidden && (
            <HiddenPanel>
              <HiddenPanelTitle>
                <AlertCircle size={15} /> Categorias ocultas — clique em
                <Check size={14} style={{ color: '#10b981' }} /> para restaurar
              </HiddenPanelTitle>
              {hiddenDefaultItems.length > 0 && (
                <>
                  <DividerLabel style={{ margin: '0 0 0.5rem' }}>Padrão</DividerLabel>
                  <CatGrid>
                    {hiddenDefaultItems.map(cat => (
                      <CatCard key={cat.key} style={{ opacity: 0.65 }}>
                        <CatEmoji>{cat.icon}</CatEmoji>
                        <CatName>{cat.label}</CatName>
                        <CatActions style={{ opacity: 1 }}>
                          <RestoreBtn onClick={() => handleRestoreDefault(cat.key)} title="Restaurar categoria">
                            <Check size={13} />
                          </RestoreBtn>
                        </CatActions>
                      </CatCard>
                    ))}
                  </CatGrid>
                </>
              )}
              {hiddenGfItems.length > 0 && (
                <>
                  <DividerLabel style={{ margin: hiddenDefaultItems.length ? '1rem 0 0.5rem' : '0 0 0.5rem' }}>Gastos fixos</DividerLabel>
                  <CatGrid>
                    {hiddenGfItems.map(gf => (
                      <CatCard key={gf.key} style={{ opacity: 0.65 }}>
                        <CatEmoji>{gf.icon}</CatEmoji>
                        <CatName>{gf.label}</CatName>
                        <CatActions style={{ opacity: 1 }}>
                          <RestoreBtn onClick={() => handleRestoreGf(gf.key)} title="Restaurar subcategoria">
                            <Check size={13} />
                          </RestoreBtn>
                        </CatActions>
                      </CatCard>
                    ))}
                  </CatGrid>
                </>
              )}
            </HiddenPanel>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle><Plus size={18} /> Categorias personalizadas</PanelTitle>
            <PanelDesc>Crie categorias próprias para organizar seus lançamentos</PanelDesc>
          </div>
        </PanelHeader>
        <PanelBody>
          {customCats.length === 0 ? (
            <p style={{ color: 'var(--cfg-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
              Nenhuma categoria personalizada ainda. Crie a primeira abaixo!
            </p>
          ) : (
            <CatGrid>
              {customCats.map(cat => (
                <CatCard key={cat.key} $editing={editingKey === cat.key}>
                  <CatEmoji>{cat.icon}</CatEmoji>
                  {editingKey === cat.key ? (
                    <>
                      <InlineInput
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(cat.key); if (e.key === 'Escape') setEditingKey(null); }}
                        autoFocus
                      />
                      <CatActions style={{ opacity: 1 }}>
                        <IconBtn onClick={() => confirmEdit(cat.key)}><Check size={13} /></IconBtn>
                        <IconBtn $danger onClick={() => setEditingKey(null)}><X size={13} /></IconBtn>
                      </CatActions>
                    </>
                  ) : (
                    <>
                      <CatName>{cat.label}</CatName>
                      <CatActions>
                        <IconBtn onClick={() => startEdit(cat)}><Pencil size={13} /></IconBtn>
                        <IconBtn $danger onClick={() => handleDeleteCustom(cat.key)}><Trash2 size={13} /></IconBtn>
                      </CatActions>
                    </>
                  )}
                </CatCard>
              ))}
            </CatGrid>
          )}

          <AddCatPanel>
            <AddCatTitle><Plus size={15} /> Nova categoria</AddCatTitle>
            <AddCatTitle style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>
              Escolha um ícone
            </AddCatTitle>
            <EmojiPicker>
              {EMOJI_OPTIONS.map(e => (
                <EmojiBtn key={e} $sel={newEmoji === e} onClick={() => setNewEmoji(e)}>{e}</EmojiBtn>
              ))}
            </EmojiPicker>
            <AddCatRow>
              <TextInput
                placeholder="Nome da categoria..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              />
              <PrimaryBtn onClick={handleAdd} disabled={!newName.trim()}>
                <Plus size={15} /> Adicionar
              </PrimaryBtn>
            </AddCatRow>
          </AddCatPanel>
        </PanelBody>
      </Panel>
    </>
  );
}

// ── SECTION: Metas ────────────────────────────────────────────────────────────
function GoalsSection({ userKey, isDark }) {
  const { metas, gastosFixosMetas, salvarMetas } = useFinance();
  const [localMetas, setLocalMetas] = useState({});
  const [localGfMetas, setLocalGfMetas] = useState({});
  const [savingsRate, setSavingsRate] = useState(10);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setLocalMetas({ ...metas }); }, [metas]);
  useEffect(() => { setLocalGfMetas({ ...gastosFixosMetas }); }, [gastosFixosMetas]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVINGS_RATE_KEY(userKey));
      if (raw !== null) setSavingsRate(Number(raw));
    } catch { /* noop */ }
  }, [userKey]);

  const allRegular = [...DEFAULT_CATS];

  const setMeta = (key, val) => {
    const num = Math.max(0, Number(val) || 0);
    setLocalMetas(prev => ({ ...prev, [key]: num }));
  };
  const setGfMeta = (key, val) => {
    const num = Math.max(0, Number(val) || 0);
    setLocalGfMetas(prev => ({ ...prev, [key]: num }));
  };

  const handleSave = () => {
    salvarMetas(localMetas, localGfMetas);
    localStorage.setItem(SAVINGS_RATE_KEY(userKey), String(savingsRate));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const MAX_META = 10000;

  return (
    <>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle><Target size={18} /> Taxa de poupança</PanelTitle>
            <PanelDesc>Percentual da renda que você quer guardar todo mês</PanelDesc>
          </div>
        </PanelHeader>
        <PanelBody>
          <SavingsCard>
            <SavingsInfo>
              <SavingsTitle>🐷 Meta de poupança mensal</SavingsTitle>
              <SavingsDesc>
                Objetivo: poupar <strong style={{ color: 'var(--cfg-primary)' }}>{savingsRate}%</strong> da receita todo mês.
                Hoje está fixo em 10% — ajuste conforme sua realidade.
              </SavingsDesc>
            </SavingsInfo>
            <SavingsControl>
              <RangeInput
                type="range" min={0} max={100} step={1}
                value={savingsRate}
                $pct={savingsRate}
                onChange={e => setSavingsRate(Number(e.target.value))}
              />
              <SavingsPct>{savingsRate}%</SavingsPct>
            </SavingsControl>
          </SavingsCard>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle><Sliders size={18} /> Limites por categoria</PanelTitle>
            <PanelDesc>
              Defina o limite máximo de gastos por categoria. Use R$ 0 para sem limite.
            </PanelDesc>
          </div>
        </PanelHeader>
        <PanelBody>
          <GoalsGrid>
            {allRegular.map(cat => {
              const val = localMetas[cat.label] || 0;
              const pct = Math.min(100, (val / MAX_META) * 100);
              return (
                <GoalCard key={cat.key}>
                  <GoalEmoji>{cat.icon}</GoalEmoji>
                  <GoalInfo>
                    <GoalLabel>{cat.label}</GoalLabel>
                    <SliderRow>
                      <RangeInput
                        type="range" min={0} max={MAX_META} step={100}
                        value={val} $pct={pct}
                        onChange={e => setMeta(cat.label, e.target.value)}
                      />
                    </SliderRow>
                  </GoalInfo>
                  <GoalAmountInput
                    type="number" min={0} max={99999} step={50}
                    value={val || ''}
                    placeholder="R$ 0"
                    onChange={e => setMeta(cat.label, e.target.value)}
                  />
                </GoalCard>
              );
            })}
          </GoalsGrid>

          <DividerLabel>Gastos fixos</DividerLabel>
          <GoalsGrid>
            {GASTOS_FIXOS.map(gf => {
              const val = localGfMetas[gf.key] || 0;
              const pct = Math.min(100, (val / MAX_META) * 100);
              return (
                <GoalCard key={gf.key}>
                  <GoalEmoji>{gf.icon}</GoalEmoji>
                  <GoalInfo>
                    <GoalLabel>{gf.label}</GoalLabel>
                    <SliderRow>
                      <RangeInput
                        type="range" min={0} max={MAX_META} step={50}
                        value={val} $pct={pct}
                        onChange={e => setGfMeta(gf.key, e.target.value)}
                      />
                    </SliderRow>
                  </GoalInfo>
                  <GoalAmountInput
                    type="number" min={0} max={99999} step={50}
                    value={val || ''}
                    placeholder="R$ 0"
                    onChange={e => setGfMeta(gf.key, e.target.value)}
                  />
                </GoalCard>
              );
            })}
          </GoalsGrid>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <SaveGoalsBtn onClick={handleSave}>
              <Save size={16} /> Salvar todas as metas
            </SaveGoalsBtn>
            {saved && (
              <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} /> Salvo com sucesso!
              </span>
            )}
          </div>
        </PanelBody>
      </Panel>
    </>
  );
}

// ── SECTION: Exportar ─────────────────────────────────────────────────────────
function ExportSection({ userKey }) {
  const { metas, gastosFixosMetas, investimentos } = useFinance();
  const hoje = competenciaHoje();
  const [fromMonth, setFromMonth] = useState(() => {
    const [y, m] = hoje.split('-').map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    return prev;
  });
  const [toMonth, setToMonth] = useState(hoje);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingJSON, setLoadingJSON] = useState(false);

  const fetchTransactions = async () => {
    const months = listMonthsBetween(fromMonth, toMonth);
    const all = [];
    for (const comp of months) {
      try {
        const res = await api.get(`/wallet/${comp}`);
        const txs = res.data?.transacoes || res.data?.transactions || [];
        all.push(...txs.map(t => ({ ...t, competencia: comp })));
      } catch { /* skip months with no data */ }
    }
    return all;
  };

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSV = async () => {
    setLoadingCSV(true);
    try {
      const txs = await fetchTransactions();
      const rows = [
        ['Data', 'Descrição', 'Valor (R$)', 'Tipo', 'Categoria', 'Competência'],
        ...txs.map(t => [
          t.data || t.data_hora || '',
          `"${(t.descricao || '').replace(/"/g, '""')}"`,
          String(t.valor || 0).replace('.', ','),
          t.tipo || '',
          t.categoria || '',
          t.competencia || '',
        ]),
      ];
      const csv = rows.map(r => r.join(';')).join('\n');
      downloadFile('﻿' + csv, `waltrix_${fromMonth}_${toMonth}.csv`, 'text/csv;charset=utf-8');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCSV(false);
    }
  };

  const handleJSON = async () => {
    setLoadingJSON(true);
    try {
      const txs = await fetchTransactions();
      const payload = {
        exportedAt: new Date().toISOString(),
        periodo: { de: fromMonth, ate: toMonth },
        transacoes: txs,
        metas,
        gastosFixosMetas,
        investimentos,
      };
      downloadFile(JSON.stringify(payload, null, 2), `waltrix_backup_${hoje}.json`, 'application/json');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJSON(false);
    }
  };

  return (
    <>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle><FileDown size={18} /> Período de exportação</PanelTitle>
            <PanelDesc>Selecione o intervalo de meses que deseja exportar</PanelDesc>
          </div>
        </PanelHeader>
        <PanelBody>
          <MonthRow>
            <div>
              <FieldLabel>De</FieldLabel>
              <MonthInput
                type="month" value={fromMonth} max={toMonth}
                onChange={e => setFromMonth(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Até</FieldLabel>
              <MonthInput
                type="month" value={toMonth} min={fromMonth} max={hoje}
                onChange={e => setToMonth(e.target.value)}
              />
            </div>
          </MonthRow>
        </PanelBody>
      </Panel>

      <ExportGrid>
        <ExportCard>
          <ExportCardTitle>
            <FileDown size={17} />
            Exportar como CSV
            <FormatBadge>.csv</FormatBadge>
          </ExportCardTitle>
          <ExportCardDesc>
            Planilha compatível com Excel, Google Sheets e outros. Inclui todas as
            transações do período com data, descrição, valor, tipo e categoria.
          </ExportCardDesc>
          <DownloadBtn onClick={handleCSV} disabled={loadingCSV} $loading={loadingCSV}>
            {loadingCSV ? (
              'Buscando dados...'
            ) : (
              <><Download size={15} /> Baixar CSV</>
            )}
          </DownloadBtn>
        </ExportCard>

        <ExportCard>
          <ExportCardTitle>
            <Package size={17} />
            Exportar como JSON
            <FormatBadge>.json</FormatBadge>
          </ExportCardTitle>
          <ExportCardDesc>
            Backup completo: transações, metas por categoria, investimentos e gastos fixos.
            Ideal para migração ou backup seguro dos seus dados.
          </ExportCardDesc>
          <DownloadBtn onClick={handleJSON} disabled={loadingJSON} $loading={loadingJSON}>
            {loadingJSON ? (
              'Buscando dados...'
            ) : (
              <><Download size={15} /> Baixar JSON</>
            )}
          </DownloadBtn>
        </ExportCard>
      </ExportGrid>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>📊 O que está incluído</PanelTitle>
          </div>
        </PanelHeader>
        <PanelBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: '💸', label: 'Transações', desc: 'Receitas e despesas do período', inCSV: true, inJSON: true },
              { icon: '🎯', label: 'Metas de gasto', desc: 'Limites por categoria', inCSV: false, inJSON: true },
              { icon: '📈', label: 'Investimentos', desc: 'Aportes registrados', inCSV: false, inJSON: true },
              { icon: '🏠', label: 'Gastos fixos', desc: 'Metas de despesas fixas', inCSV: false, inJSON: true },
            ].map(item => (
              <div key={item.label} style={{
                padding: '0.875rem', borderRadius: '0.625rem',
                background: 'var(--cfg-surface-muted)', border: '1px solid var(--cfg-border)',
              }}>
                <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: 'var(--cfg-heading)', fontSize: '0.875rem' }}>
                  {item.icon} {item.label}
                </p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--cfg-muted)' }}>{item.desc}</p>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {item.inCSV && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.3rem', background: 'var(--cfg-primary-soft)', color: 'var(--cfg-primary)' }}>CSV</span>}
                  {item.inJSON && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.3rem', background: 'var(--cfg-primary-soft)', color: 'var(--cfg-primary)' }}>JSON</span>}
                </div>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Configuracoes() {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [section, setSection] = useState('categorias');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userKey = user?._id || user?.email || 'anon';

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const TABS = [
    { id: 'categorias', label: 'Categorias',   icon: Tag     },
    { id: 'metas',      label: 'Metas',         icon: Target  },
    { id: 'exportar',   label: 'Exportar dados', icon: FileDown },
  ];

  return (
    <AppContainer $dark={isDark}>
      <MobileOverlay $visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <LogoArea><Wallet size={22} /> Waltrix</LogoArea>
        <NavMenu>
          <NavItem onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}>
            <Home size={17} /> Dashboard
          </NavItem>
          <NavItem onClick={() => { navigate('/investimentos'); setSidebarOpen(false); }}>
            <TrendingUp size={17} /> Investimentos
          </NavItem>
          <NavItem onClick={() => { navigate('/relatorios'); setSidebarOpen(false); }}>
            <FileText size={17} /> Relatórios
          </NavItem>
          <NavItem $active onClick={() => setSidebarOpen(false)}>
            <Settings size={17} /> Configurações
          </NavItem>
        </NavMenu>
        <SidebarFooter>
          <ThemeToggleBox $dark={isDark} onClick={toggleTheme}>
            <ThemeToggleMeta>
              {isDark ? <Moon size={16} /> : <SunMedium size={16} />}
              <div>
                <strong>{isDark ? 'Modo escuro' : 'Modo claro'}</strong>
                <span>Alternar tema</span>
              </div>
            </ThemeToggleMeta>
            <SwitchTrack $on={isDark} $dark={isDark}>
              <SwitchThumb $on={isDark}>
                {isDark ? <Moon size={9} /> : <SunMedium size={9} />}
              </SwitchThumb>
            </SwitchTrack>
          </ThemeToggleBox>
          <LogoutButton onClick={handleLogout}>
            <LogOut size={17} /> Sair da conta
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      <MainContent>
        <MobileHeader>
          <LogoArea style={{ margin: 0, fontSize: '1rem' }}><Wallet size={18} /> Waltrix</LogoArea>
          <MenuBtn onClick={() => setSidebarOpen(o => !o)}><Menu size={18} /></MenuBtn>
        </MobileHeader>

        <ContentArea>
          <ContentWrapper>
            <PageHeader>
              <PageTitle>Configurações</PageTitle>
              <PageDesc>
                Personalize categorias, defina metas de gastos e exporte seus dados financeiros.
              </PageDesc>
            </PageHeader>

            <TabsRow>
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabBtn key={tab.id} $active={section === tab.id} onClick={() => setSection(tab.id)}>
                    <Icon size={15} /> {tab.label}
                  </TabBtn>
                );
              })}
            </TabsRow>

            {section === 'categorias' && (
              <CategoriesSection userKey={userKey} isDark={isDark} />
            )}
            {section === 'metas' && (
              <GoalsSection userKey={userKey} isDark={isDark} />
            )}
            {section === 'exportar' && (
              <ExportSection userKey={userKey} />
            )}
          </ContentWrapper>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}
