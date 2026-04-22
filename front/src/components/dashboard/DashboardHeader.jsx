import React from 'react';
import styled from 'styled-components';
import { Plus, Menu } from 'lucide-react';
import ImportButton from '../ImportButton';
import { formatarCompetencia } from './dashboardUtils';

// ── Styled ────────────────────────────────────────────────────────────────────
const Header = styled.header`
  min-height: 60px; background: var(--dash-shell); border-bottom: 1px solid var(--dash-border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.75rem; flex-shrink: 0; gap: 0.75rem; flex-wrap: wrap;
  backdrop-filter: blur(18px);
  @media (max-width: 768px) { padding: 0.75rem 1rem; }
`;
const HeaderLeft = styled.div`display: flex; align-items: center; gap: 0.625rem;`;
const HeaderTitle = styled.h2`font-size: 1.125rem; font-weight: 600; color: var(--dash-heading); white-space: nowrap;`;
const HamburgerBtn = styled.button`
  display: none; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: 1px solid var(--dash-border);
  border-radius: 0.5rem; background: var(--dash-surface); color: var(--dash-heading);
  cursor: pointer; flex-shrink: 0; transition: background 0.15s;
  &:hover { background: var(--dash-surface-muted); }
  @media (max-width: 768px) { display: flex; }
`;
const HeaderActions = styled.div`
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end;
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
const BtnText = styled.span`@media (max-width: 480px) { display: none; }`;
const MonthSelectorWrap = styled.div`display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;`;
const MonthSelect = styled.select`
  appearance: none; -webkit-appearance: none;
  padding: 0.5rem 2.25rem 0.5rem 0.875rem;
  border: 1px solid var(--dash-border); border-radius: 0.65rem;
  background-color: var(--dash-surface);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2389a0c7' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.6rem center;
  color: var(--dash-heading); font-size: 0.875rem; font-weight: 700;
  outline: none; cursor: pointer; box-shadow: var(--dash-soft-shadow);
  transition: border-color 0.15s, box-shadow 0.15s; min-width: 11rem;
  max-width: 100%; flex: 1;
  &:focus { border-color: var(--dash-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.14); }
  option { font-weight: 400; background: var(--dash-surface); color: var(--dash-heading); }
  @media (max-width: 480px) { min-width: 0; font-size: 0.8rem; padding: 0.45rem 2rem 0.45rem 0.75rem; }
`;
const MesBadge = styled.span`
  display: inline-flex; align-items: center;
  padding: 0.22rem 0.65rem; border-radius: 99px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; white-space: nowrap;
  background: ${p => p.$hoje ? 'var(--dash-primary-soft)' : p.$dark ? 'rgba(120,80,0,0.25)' : '#fef3c7'};
  border: 1px solid ${p => p.$hoje ? 'var(--dash-primary)' : p.$dark ? 'rgba(251,191,36,0.35)' : '#fcd34d'};
  color: ${p => p.$hoje ? 'var(--dash-primary)' : p.$dark ? '#fcd34d' : '#92400e'};
  @media (max-width: 480px) { display: none; }
`;

// ── Componente ────────────────────────────────────────────────────────────────
export default function DashboardHeader({
  mesSelecionado,
  mesesEfetivos,
  ehMesAtual,
  isDark,
  onMesChange,
  importingExtract,
  onImportFile,
  onError,
  onAddTransaction,
  onMenuToggle,
}) {
  return (
    <Header>
      <HeaderLeft>
        <HamburgerBtn onClick={onMenuToggle} aria-label="Abrir menu">
          <Menu size={18} />
        </HamburgerBtn>
        <HeaderTitle>Visão Geral</HeaderTitle>
      </HeaderLeft>

      <MonthSelectorWrap>
        <MonthSelect value={mesSelecionado} onChange={e => onMesChange(e.target.value)}>
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
          onSelectFile={onImportFile}
          onError={onError}
        />
        <AddButton onClick={onAddTransaction} disabled={!ehMesAtual}>
          <Plus size={15} /> <BtnText>Nova Transação</BtnText>
        </AddButton>
      </HeaderActions>
    </Header>
  );
}
