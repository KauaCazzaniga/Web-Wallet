// Componente: InvestmentPanel
// Responsabilidade: Painel simplificado de patrimônio — total acumulado, carteira,
//   cofrinhos, aporte do mês e botão "Registrar aporte"
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

/** Destaque do patrimônio total */
const PatrimonioTotal = styled.div`
  padding: 1rem 1.2rem; border-radius: 0.9rem;
  background: linear-gradient(135deg, rgba(127,119,221,0.12) 0%, rgba(91,103,255,0.08) 100%);
  border: 1px solid rgba(127,119,221,0.22);
  span   { display: block; font-size: 0.76rem; color: var(--dash-muted); text-transform: uppercase;
           letter-spacing: 0.05em; margin-bottom: 0.35rem; }
  strong { display: block; font-size: 1.6rem; color: var(--dash-heading); letter-spacing: -0.04em; font-weight: 700; }
`;

const InvestmentStats = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;
`;
const InvestmentStat = styled.div`
  padding: 0.85rem 1rem; border-radius: 0.9rem;
  background: var(--dash-surface-muted); border: 1px solid var(--dash-border);
  span   { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: var(--dash-muted);
           text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; }
  strong { display: block; font-size: 1.1rem; color: var(--dash-heading); letter-spacing: -0.03em; }
`;
const StatIcon = styled.span`font-size: 0.85rem; line-height: 1;`;

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
 * @param {number}   totalInvestido        - Aportes acumulados via extrato (wallet transactions)
 * @param {number}   portfolioTotal        - Soma do portfólio cadastrado na aba Investimentos
 * @param {number}   cofrinhoTotal         - Soma acumulada dos cofrinhos
 * @param {number}   aporteMesSelecionado  - Soma de aportes somente do mês selecionado
 * @param {boolean}  ehMesAtual            - Se falso, desabilita o botão de registrar
 * @param {Function} onRegisterAporte      - Abre o modal de registro de aporte
 */
export default function InvestmentPanel({
  totalInvestido,
  portfolioTotal,
  cofrinhoTotal,
  aporteMesSelecionado,
  ehMesAtual,
  onRegisterAporte,
}) {
  const capital = (cofrinhoTotal || 0) + (portfolioTotal || 0);

  return (
    <InvestmentPanelBox>
      <InvestmentHead>
        <InvestmentIcon>📈</InvestmentIcon>
        <div>
          <strong>Patrimônio</strong>
          <span>Visão consolidada de carteira e cofrinhos.</span>
        </div>
      </InvestmentHead>

      <PatrimonioTotal>
        <span>Capital</span>
        <strong>{fmtCurrency(capital)}</strong>
      </PatrimonioTotal>

      <InvestmentStats>
        <InvestmentStat>
          <span><StatIcon>🐷</StatIcon>Cofrinhos</span>
          <strong>{fmtCurrency(cofrinhoTotal)}</strong>
        </InvestmentStat>
        <InvestmentStat>
          <span><StatIcon>📊</StatIcon>Investimentos</span>
          <strong>{fmtCurrency(portfolioTotal)}</strong>
        </InvestmentStat>
        <InvestmentStat>
          <span><StatIcon>📅</StatIcon>Aporte do mês</span>
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
