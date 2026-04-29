// Componente: GoalCards
// Responsabilidade: Orçamento mensal (donut), gastos por categoria e gastos fixos (acordeão)
// Depende de: GerenciarMetas, dashboardStyles (Panel, PanelHeader), dashboardUtils (fmt, CAT_ICONS), gastosFixos

import React from 'react';
import styled from 'styled-components';
import { AlertTriangle } from 'lucide-react';
import GerenciarMetas from '../GerenciarMetas';
import { Panel, PanelHeader } from './dashboardStyles';
import { fmt, CAT_ICONS } from './dashboardUtils';
import { useFinance } from '../../context/FinanceContext';

// ── Styled ────────────────────────────────────────────────────────────────────
const MainGrid = styled.div`
  display: grid; gap: 1.25rem; grid-template-columns: 1fr;
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
`;
const BudgetPanel = styled(Panel)`display: flex; flex-direction: column; align-items: center;`;
const CategoryPanel = styled(Panel)`@media(min-width:1024px){ grid-column: span 2; }`;

// Donut
const DonutWrap = styled.div`
  position: relative; width: 150px; height: 150px;
  display: flex; align-items: center; justify-content: center;
  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .bg { fill: none; stroke: var(--dash-border); stroke-width: 3; }
  .fg { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 1s ease, stroke 0.4s; }
`;
const DonutLabel = styled.div`
  position: absolute; display: flex; flex-direction: column; align-items: center;
  span:first-child { font-size: 1.75rem; font-weight: 700; color: var(--dash-heading); line-height: 1; }
  span:last-child  { font-size: 0.7rem; color: var(--dash-muted); margin-top: 2px; }
`;
const BudgetMeta = styled.div`
  margin-top: 1.25rem; text-align: center; width: 100%;
  p      { font-size: 0.8rem; color: var(--dash-muted); margin-bottom: 0.25rem; }
  strong { font-size: 1.125rem; font-weight: 700; color: var(--dash-heading); display: block; }
`;
const AlertBox = styled.div`
  margin-top: 0.875rem; padding: 0.5rem 0.75rem;
  background: var(--dash-danger-soft); border: 1px solid var(--dash-danger-border); border-radius: 0.5rem;
  font-size: 0.75rem; color: #dc2626; display: flex; align-items: center; gap: 0.4rem;
`;

// Categorias
const CatList = styled.div`display: flex; flex-direction: column; gap: 1rem;`;
const CatRow  = styled.div`display: flex; align-items: flex-start; gap: 0.875rem;`;
const CatIcon = styled.div`
  width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--dash-surface-muted);
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.08); filter: brightness(1.08); box-shadow: 0 12px 24px rgba(37,99,235,0.18); }
`;
const CatName = styled.p`font-size: 0.875rem; font-weight: 600; color: var(--dash-heading); margin-bottom: 0.35rem;`;
const BarWrap  = styled.div`width: 100%;`;
const BarInfo  = styled.div`
  display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;
  span:first-child { color: var(--dash-text); }
  span:last-child  { font-weight: 600; color: ${p => p.$over ? '#dc2626' : 'var(--dash-muted)'}; }
`;
const BarTrack = styled.div`height: 0.375rem; background: var(--dash-border); border-radius: 99px; overflow: hidden;`;
const BarFill  = styled.div`
  height: 100%; border-radius: 99px; transition: width 0.6s ease;
  width: ${p => p.$w}%; background: ${p => p.$c};
`;

// Gastos Fixos acordeão
const GFPaiRow = styled.div`
  display: flex; align-items: center; gap: 0.875rem; cursor: pointer;
  padding: 0.5rem 0.35rem; border-radius: 0.625rem; transition: background 0.15s;
  &:hover { background: var(--dash-surface-muted); }
`;
const GFChevron = styled.span`
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.7rem; color: var(--dash-muted); transition: transform 0.3s ease;
  transform: rotate(${p => p.$open ? '90deg' : '0deg'});
  flex-shrink: 0; width: 1rem;
`;
const GFFilhosWrap = styled.div`
  overflow: hidden; transition: max-height 0.3s ease;
  max-height: ${p => p.$open ? '1200px' : '0px'};
`;
const GFFilhoRow = styled.div`
  display: flex; align-items: flex-start; gap: 0.75rem;
  margin-left: 24px; padding: 0.45rem 0; position: relative;
  &::before {
    content: ''; position: absolute; left: -12px; top: 0; bottom: 0;
    width: 1px; background: var(--dash-muted); opacity: 0.3;
  }
`;
const GFFilhoIcon = styled.div`
  width: 1.85rem; height: 1.85rem; border-radius: 50%; background: var(--dash-surface-muted);
  display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0;
`;
const GFFilhoName = styled.p`font-size: 0.8125rem; font-weight: 600; color: var(--dash-heading); margin-bottom: 0.3rem;`;
const GFBarTrack  = styled.div`height: 4px; background: var(--dash-border); border-radius: 99px; overflow: hidden;`;
const GFBarFill   = styled.div`
  height: 100%; border-radius: 99px; transition: width 0.6s ease;
  width: ${p => p.$w}%; background: ${p => p.$c};
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
/** Cor progressiva para barras de Gastos Fixos */
const getBarColorGF = (pct) => {
  if (pct >= 100) return '#E24B4A';
  if (pct >= 86)  return '#D85A30';
  if (pct >= 61)  return '#EF9F27';
  return '#378ADD';
};

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

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {number}   totalDespesas       - Total de despesas do mês
 * @param {number}   totalOrcamento      - Soma de todos os limites de metas
 * @param {boolean}  acima               - true se despesas > orçamento
 * @param {string[]} todasCategorias     - Categorias a renderizar (excl. gastos_fixos.*)
 * @param {Object}   gastosAtuais        - { [categoria]: valor gasto }
 * @param {Object}   limites             - { [categoria]: limite meta }
 * @param {string}   mesSelecionado      - Mês ativo para GerenciarMetas
 * @param {Function} notify              - Toast callback
 * @param {boolean}  gastosFixosAberto   - Acordeão aberto
 * @param {Function} toggleGastosFixos   - Toggle do acordeão
 * @param {Object}   gfGastos            - { [key]: valor gasto } de gastos fixos
 * @param {Object}   gfMetas             - { [key]: meta } de gastos fixos
 * @param {number}   gfTotalGasto        - Soma de todos os gastos fixos
 * @param {number}   gfTotalMeta         - Soma de metas de gastos fixos (com meta > 0)
 * @param {number}   gfTotalPct          - Percentual total gastos fixos (-1 = sem meta)
 */
export default function GoalCards({
  totalDespesas,
  totalOrcamento,
  acima,
  todasCategorias,
  gastosAtuais,
  limites,
  mesSelecionado,
  notify,
  gastosFixosAberto,
  toggleGastosFixos,
  gfGastos,
  gfMetas,
  gfTotalGasto,
  gfTotalMeta,
  gfTotalPct,
}) {
  const { visibleGastosFix } = useFinance();
  return (
    <MainGrid>
      {/* Orçamento */}
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

      {/* Categorias + Gastos Fixos */}
      <CategoryPanel>
        <PanelHeader>
          <h3>Gasto por Categoria</h3>
          <GerenciarMetas mesSelecionado={mesSelecionado} notify={notify} />
        </PanelHeader>
        <CatList>

          {/* Gastos Fixos — grupo expansível */}
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
              {visibleGastosFix.map(({ key, label, icon }) => {
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
  );
}
