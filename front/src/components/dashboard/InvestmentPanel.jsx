// Componente: InvestmentPanel
// Responsabilidade: Painel de investimentos — total acumulado, aporte do mês e botão "Registrar aporte"
// Depende de: dashboardStyles (Panel), dashboardUtils (fmtCurrency), lucide-react

import React from 'react';
import styled from 'styled-components';
import { Plus } from 'lucide-react';
import { Panel } from './dashboardStyles';
import { fmtCurrency } from './dashboardUtils';

// ── Styled ────────────────────────────────────────────────────────────────────
const InvestmentPanelBox = styled(Panel)`
  display: flex; flex-direction: column; gap: 1.2rem;
`;
const InvestmentHead = styled.div`
  display: flex; align-items: center; gap: 0.75rem; color: var(--dash-heading);
  strong { display: block; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; }
  span   { display: block; color: var(--dash-muted); font-size: 0.82rem; margin-top: 0.15rem; }
`;
const InvestmentIcon = styled.div`
  width: 2.8rem; height: 2.8rem; display: grid; place-items: center;
  border-radius: 0.9rem; font-size: 1.35rem;
  background: rgba(127,119,221,0.14); color: #7F77DD;
  box-shadow: inset 0 0 0 1px rgba(127,119,221,0.2);
`;
const InvestmentStats = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;
  @media (max-width: 720px) { grid-template-columns: 1fr; }
`;
const InvestmentStat = styled.div`
  padding: 1rem 1.1rem; border-radius: 0.9rem;
  background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  span   { display: block; font-size: 0.76rem; color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.45rem; }
  strong { display: block; font-size: 1.35rem; color: var(--dash-heading); letter-spacing: -0.04em; }
`;
const InvestmentAction = styled.button`
  width: fit-content; display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.78rem 1rem; border: none; border-radius: 0.8rem; cursor: pointer;
  color: #fff; font-size: 0.88rem; font-weight: 700;
  background: linear-gradient(135deg, #7F77DD 0%, #5b67ff 100%);
  box-shadow: 0 14px 28px rgba(127,119,221,0.26);
  transition: transform .22s ease, filter .22s ease;
  &:hover { transform: translateY(-3px); filter: brightness(1.05); }
  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
`;

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {number}   totalInvestido        - Soma acumulada de aportes até o mês selecionado
 * @param {number}   aporteMesSelecionado  - Soma de aportes somente do mês selecionado
 * @param {boolean}  ehMesAtual            - Se falso, desabilita o botão de registrar
 * @param {Function} onRegisterAporte      - Abre o modal de registro de aporte
 */
export default function InvestmentPanel({
  totalInvestido,
  aporteMesSelecionado,
  ehMesAtual,
  onRegisterAporte,
}) {
  return (
    <InvestmentPanelBox>
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

      <InvestmentAction onClick={onRegisterAporte} disabled={!ehMesAtual}>
        <Plus size={16} />
        Registrar aporte
      </InvestmentAction>
    </InvestmentPanelBox>
  );
}
